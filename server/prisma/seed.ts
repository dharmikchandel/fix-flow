import "dotenv/config";
import prisma from "../src/config/database.js";
import { calculateSeverity } from "../src/services/severityService.js";
import { assignBug } from "../src/services/assignmentService.js";
import bcrypt from "bcrypt";

/**
 * Seeds a demoable FixFlow instance: a handful of engineers with different
 * expertise/capacity, and a spread of bugs across severities and statuses.
 *
 * Runs the real severity engine and assignment engine while seeding (instead
 * of hardcoding fake scores) so the seeded data always matches what the app
 * would actually produce, and stays correct as those engines change.
 */

const DEMO_PASSWORD = "changeme123";

const ENGINEERS = [
  { name: "Priya Sharma", email: "priya@fixflow.dev", expertise: ["auth", "security", "api"], maxCapacity: 5 },
  { name: "Diego Alvarez", email: "diego@fixflow.dev", expertise: ["payment", "database"], maxCapacity: 4 },
  { name: "Wei Chen", email: "wei@fixflow.dev", expertise: ["ui", "core"], maxCapacity: 6 },
  { name: "Aisha Bello", email: "aisha@fixflow.dev", expertise: ["api", "core", "database"], maxCapacity: 5 },
  { name: "Sam Okafor", email: "sam@fixflow.dev", expertise: ["ui", "docs"], maxCapacity: 3, available: false },
];

// A lead/manager account so there's someone who can log in and dispatch bugs
// or register new engineers on a freshly seeded instance. Not part of the
// assignable engineer pool (that pool is filtered by role: "engineer").
const MANAGER = { name: "Jordan Lee", email: "jordan@fixflow.dev", role: "manager" };

const BUGS = [
  {
    title: "Login crashes on production for SSO users",
    description: "App crashes with a fatal exception whenever an SSO user attempts to log in on the production environment. Affects roughly 30% of enterprise accounts.",
    stepsToReproduce: "1. Log in with an SSO-linked account\n2. Observe crash on redirect callback",
    module: "auth",
    environment: "production",
  },
  {
    title: "Checkout hangs after payment confirmation",
    description: "The checkout flow freezes and becomes unresponsive right after the payment provider confirms the charge, leaving the order in a stuck state.",
    module: "payment",
    environment: "production",
  },
  {
    title: "Dashboard chart flickers on resize",
    description: "The severity distribution chart flickers noticeably when the browser window is resized. Purely cosmetic, low impact.",
    module: "ui",
    environment: "staging",
  },
  {
    title: "Duplicate rows returned from search API",
    description: "The bug search endpoint occasionally returns the same record twice, which is inconsistent and confuses the triage queue counts.",
    module: "api",
    environment: "production",
  },
  {
    title: "Database connection pool exhausted under load",
    description: "Under moderate concurrent load the connection pool is exhausted, causing a cascade of timeout errors and request failures across the API.",
    stepsToReproduce: "1. Run 50 concurrent requests against /bugs\n2. Observe pool exhaustion after ~30s",
    module: "database",
    environment: "production",
  },
  {
    title: "Typo in onboarding docs",
    description: "The quickstart guide has a small typo in the environment variable name for the API base URL.",
    module: "docs",
    environment: "production",
  },
  {
    title: "Slow response time on priority queue endpoint",
    description: "The priority queue endpoint has become noticeably slow, taking several seconds to respond as the number of open bugs grows.",
    module: "api",
    environment: "staging",
  },
  {
    title: "Settings page missing validation on capacity field",
    description: "The engineer capacity field accepts negative numbers and non-numeric input without a client-side or server-side validation error.",
    module: "core",
    environment: "development",
  },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.assignment.deleteMany();
  await prisma.bugReport.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating manager account...");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.create({
    data: {
      name: MANAGER.name,
      email: MANAGER.email,
      password: hashedPassword,
      role: MANAGER.role,
      expertise: [],
    },
  });

  console.log("Creating engineers...");
  for (const engineer of ENGINEERS) {
    await prisma.user.create({
      data: {
        name: engineer.name,
        email: engineer.email,
        password: hashedPassword,
        role: "engineer",
        expertise: engineer.expertise,
        maxCapacity: engineer.maxCapacity,
        available: engineer.available ?? true,
      },
    });
  }

  console.log("Creating bugs...");
  const createdBugIds: string[] = [];
  for (const bug of BUGS) {
    const severity = calculateSeverity(bug.title, bug.description, bug.module, bug.environment);
    const created = await prisma.bugReport.create({
      data: {
        title: bug.title,
        description: bug.description,
        stepsToReproduce: bug.stepsToReproduce ?? null,
        module: bug.module,
        environment: bug.environment,
        severityScore: severity.score,
        severityLabel: severity.label,
        status: "open",
      },
    });
    createdBugIds.push(created.id);
  }

  console.log("Assigning some bugs through the real assignment engine...");
  // Assign the first five; leave the rest open so the triage queue has work to show.
  for (const bugId of createdBugIds.slice(0, 5)) {
    try {
      await assignBug(bugId);
    } catch (err) {
      console.warn(`Could not auto-assign bug ${bugId}:`, err instanceof Error ? err.message : err);
    }
  }

  // Mark one assigned bug as resolved and one as in_progress, so status filters have data too.
  const [firstBugId, secondBugId] = createdBugIds;
  if (firstBugId) {
    await prisma.bugReport.update({ where: { id: firstBugId }, data: { status: "in_progress" } });
  }
  if (secondBugId) {
    await prisma.bugReport.update({ where: { id: secondBugId }, data: { status: "resolved" } });
  }

  console.log(`Done. Seeded 1 manager, ${ENGINEERS.length} engineers, and ${BUGS.length} bugs.`);
  console.log(`Every seeded account shares the password: ${DEMO_PASSWORD}`);
  console.log(`Log in as the manager (${MANAGER.email}) to dispatch bugs and register new engineers.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
