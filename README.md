# 𖢥 FixFlow

> **A bug tracker that triages itself.**

FixFlow is a tool for engineering teams to report, sort, and fix bugs without the usual busywork. When someone submits a bug, FixFlow automatically figures out how serious it is, checks whether it's a duplicate of something already reported, and assigns it to the engineer best suited to fix it — all using clear, fixed rules instead of a black-box AI model, so anyone on the team can see exactly *why* a bug was scored or assigned the way it was.

It's built for more than one team at a time: each company or team that signs up gets its own private space, completely separate from everyone else's.

## 🌐 Try it yourself here

> **https://fixflow.dharmikchandel.tech**

---

## Table of contents

- [What FixFlow does](#what-fixflow-does)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [How the triage engine works](#how-the-triage-engine-works)
  - [Severity scoring](#severity-scoring)
  - [Duplicate detection](#duplicate-detection)
  - [Assignment engine](#assignment-engine)
  - [Priority queue](#priority-queue)
- [How accounts and teams work](#how-accounts-and-teams-work)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend setup](#backend-setup)
  - [Frontend setup](#frontend-setup)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Design system](#design-system)

---

## 📌 What FixFlow does

**Triage, automatically**
- **Bug intake** — anyone on the team can submit a bug with a title, description, steps to reproduce, which part of the product it's in, and where it happened (production, staging, etc.)
- **Automatic severity scoring** — every bug gets a score from 0 to 100 and a plain label (Low / Medium / High / Critical), worked out from the words used in the report, which part of the product is affected, and where it happened. It also shows a **confidence** reading and a breakdown of exactly what contributed to the score, so the number is never just asserted — it's explained.
- **Duplicate detection** — new bugs are automatically compared against everything already open, and likely duplicates are flagged right away.
- **Smart assignment** — a bug can be auto-assigned to whichever available engineer knows that part of the product and currently has the lightest workload, or a team lead can assign it to someone specific by hand.
- **Priority queue** — a single ranked list of everything that needs attention, blending severity, how long a bug has sat unfixed, and whether it's assigned yet.

**Built for a real team, not just one person**
- **Accounts, sign-up, and invites** — anyone can create a new team ("organization") and become its first manager. Growing the team happens through invite links — the person joining always picks their own password, so a manager never has to know anyone else's.
- **Roles** — engineers can report bugs, comment, and manage their own availability. Leads and managers can additionally dispatch bugs and invite teammates.
- **Every team's data is private** — two different companies using FixFlow never see each other's bugs, people, or stats.

**Working on a bug**
- **Activity timeline & comments** — every bug has a running history of everything that happened to it (reported, assigned, status changed, commented on), plus a real comment thread so people can talk about it in place.
- **Attachments** — screenshots, logs, or other files can be attached directly to a bug.
- **Notifications** — get notified in-app when a bug is assigned to you, someone comments on a bug you reported, or a Critical bug comes in.

**Seeing the big picture**
- **Analytics dashboard** — team-wide stats: open/critical/unassigned bug counts, overloaded engineers, duplicate rate, average time to first assignment, a severity breakdown, and a heatmap showing which part of the product is causing the most trouble right now.
- **Search & pagination** — the bug list stays fast and searchable no matter how many bugs pile up.

**The look**
- **Dark, command-center UI** — a Next.js dashboard styled like an engineering control room: dark surfaces, restrained neon accents used only for status and emphasis, and monospace type for technical details like IDs and timestamps.

## 🛠️ Tech stack

**Backend** (`server/`)
- Node.js + TypeScript
- Express 5
- PostgreSQL + Prisma (the database toolkit)
- Zod (checks that incoming data is well-formed before anything touches the database)
- JWT + bcrypt (how login sessions and passwords are handled securely)

**Frontend** (`client/`)
- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- TanStack Query (keeps data in sync across pages without every page fetching everything itself)
- Axios API client
- shadcn/ui-style component primitives

## 📂 Project structure

```
fix-flow/
├── client/                      # Next.js frontend
│   ├── app/
│   │   ├── page.tsx             # Dashboard
│   │   ├── login/, register/, accept-invite/   # Sign in, create a team, join a team
│   │   ├── bugs/                 # Bug list + bug detail (bugs/[id])
│   │   ├── triage/               # Priority-ranked triage queue
│   │   ├── assignments/         # Engineer workload, manual dispatch, invites
│   │   └── analytics/           # Team-wide stats and the module heatmap
│   ├── components/
│   │   ├── auth/                 # Login/session handling
│   │   ├── layout/               # Navbar, sidebar (the app shell)
│   │   ├── providers/            # Data-fetching setup (React Query)
│   │   └── ui/                   # Button, card, badge, input primitives
│   ├── lib/
│   │   ├── api.ts                # Typed API client
│   │   ├── queryKeys.ts          # Shared cache keys for data fetching
│   │   └── types.ts              # Shared frontend types (mirror the server's models)
│   └── DESIGN.md                 # UI/UX design system reference
│
└── server/                      # Express backend
    ├── prisma/
    │   ├── schema.prisma         # Every database table, defined here
    │   └── seed.ts                # Demo data — two sample teams, ready to explore
    ├── src/
    │   ├── controllers/          # One file per resource — reads the request, calls a service, sends the response
    │   ├── services/              # The actual logic: severity scoring, duplicate detection, assignment, priority, analytics, ...
    │   ├── routes/                 # Which URL maps to which controller
    │   ├── middleware/            # Login checks, role checks, rate limiting, file uploads
    │   ├── models/                 # Validation rules + shared types
    │   ├── config/                 # Environment variables + database connection
    │   └── utils/                   # Small helpers (text similarity, error handling, tokens)
    └── PRD.md                     # Original product requirements document
```

## 🧠 How the triage engine works

This is the part of FixFlow that does the actual thinking. All four pieces below are plain, fixed rules — not machine learning — so the same bug report always produces the same result, and anyone can look at the code and understand exactly why.

### Severity scoring

`server/src/services/severityService.ts` reads every submitted bug and works out a score from 0 to 100:

1. **Keyword scoring** — the title and description are scanned for words that signal trouble. Words like `crash`, `deadlock`, or `security breach` count for a lot; words like `failure` or `blocker` count for a medium amount; words like `slow` or `flicker` count for a little. (This is capped, so stuffing a report with buzzwords doesn't inflate the score forever.)
2. **Which part of the product** — some areas matter more than others by default. A bug in `payment` or `security` starts with a higher baseline than one in `docs`.
3. **How much detail was given** — a longer, more detailed report gets a small bonus, on the theory that people tend to write more when a bug is genuinely worse.
4. **Where it happened** — a bug in production counts for more than the same bug in a test environment.

The final number gets a label: `Critical` (75+), `High` (50+), `Medium` (25+), or `Low` (below that). FixFlow also shows a **confidence** percentage — a score that lands right on the edge between two labels (say, 74 vs. 75) is shown as less certain than one that lands solidly in the middle of a bucket, instead of pretending every score is equally sure of itself.

### Duplicate detection

`server/src/services/duplicateService.ts` compares a new bug's title and description against everything already open, using a simple text-similarity technique (the Sørensen–Dice method — in plain terms, it breaks both pieces of text into overlapping pairs of letters and measures how many pairs they have in common). Anything similar enough gets flagged as a likely duplicate, most-similar first, up to 5 matches.

### Assignment engine

`server/src/services/assignmentService.ts` picks who a bug goes to:

1. Look for engineers who are marked available, list this part of the product as something they know, and aren't already at capacity.
2. Of those, pick whoever currently has the lightest workload.
3. If nobody specialized is free, fall back to any available engineer under capacity, regardless of specialty.
4. Record the assignment and bump that engineer's workload by one, all as a single all-or-nothing database operation — so it can never happen halfway.

A team lead can also skip the automatic picker and assign a bug to a specific engineer by hand (as long as that engineer actually has room). Unassigning a bug reverses all of this and puts the bug back in the open queue.

### Priority queue

`server/src/services/priorityService.ts` produces one ranked list of everything that still needs attention, using a simple weighted formula:

```
priority score = severity × 0.6 + age × 0.3 + (unassigned bonus) × 0.1
```

Older bugs and unassigned bugs both get nudged up the list, so nothing sits forgotten just because it wasn't the most severe thing reported today. The list is recalculated fresh every time it's requested.

## 👤 How accounts and teams work

Every person who uses FixFlow belongs to exactly one **organization** — the workspace for their company or team. Two organizations never see each other's bugs, engineers, or stats, even though they're running on the same FixFlow install.

- **Starting a new team** — the first person signs up through the registration page, which creates both the organization and their own account (as a manager) in one step.
- **Growing a team** — a lead or manager creates an invite link for a teammate's email address. The invited person opens the link and picks their own name and password — nobody else ever knows it.
- **Roles** — every account is an `engineer`, `lead`, or `manager`. Engineers can report bugs, comment, and toggle their own availability. Leads and managers can additionally dispatch bugs to engineers and invite new teammates.

## ⛁ Data model

Defined in `server/prisma/schema.prisma`:

- **`Organization`** — one row per team using FixFlow. Everything below belongs to exactly one organization.
- **`User`** — an account: name, email, a securely hashed password, role, areas of expertise, current workload, capacity, and availability.
- **`BugReport`** — the bug itself: title, description, steps to reproduce, which part of the product, where it happened, its severity score/label, how many likely duplicates it had, its status, and who reported it.
- **`Assignment`** — links one bug to the engineer currently on it, with a plain-English reason for the match.
- **`Invite`** — a pending invitation to join an organization, tied to a one-time link that expires after 7 days.
- **`BugEvent`** — one row for every event in a bug's life (reported, assigned, unassigned, status changed, commented) — this is what powers the activity timeline.
- **`Attachment`** — a file attached to a bug (screenshot, log excerpt, etc.).
- **`Notification`** — an in-app alert for one specific person.

## API reference

Base path: `/api`

Every route below except `/health`, `POST /auth/login`, `POST /auth/register`, and `POST /invites/accept` requires a valid `Authorization: Bearer <token>` header, obtained by logging in. Every response only ever contains your own organization's data. Routes marked **lead/manager** additionally require that role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/register` | Create a brand-new organization and its first (manager) account |
| `POST` | `/auth/login` | Log in with email + password, returns a login token |
| `GET` | `/auth/me` | Get the currently logged-in user |
| `POST` | `/invites` | **lead/manager.** Create an invite link for a new teammate |
| `GET` | `/invites` | **lead/manager.** List pending invites |
| `DELETE` | `/invites/:id` | **lead/manager.** Revoke a pending invite |
| `POST` | `/invites/accept` | Accept an invite: set a name + password and join |
| `POST` | `/bugs` | Submit a new bug (runs severity scoring + duplicate detection) |
| `GET` | `/bugs` | List bugs (filter with `?status=`, search with `?search=`, page with `?page=` / `?pageSize=`) |
| `GET` | `/bugs/:id` | Get a single bug, including its severity breakdown |
| `PATCH` | `/bugs/:id/status` | Update a bug's status |
| `GET` | `/bugs/:id/events` | Get a bug's full activity timeline (system events + comments) |
| `POST` | `/bugs/:id/comments` | Add a comment to a bug |
| `POST` | `/bugs/:id/attachments` | Upload a file to a bug (multipart form, field name `file`) |
| `GET` | `/bugs/:id/attachments` | List a bug's attachments |
| `GET` | `/attachments/:id` | Download a file |
| `DELETE` | `/attachments/:id` | Remove a file (your own upload, or any if lead/manager) |
| `POST` | `/assign` | **lead/manager.** Assign a bug to the best-fit engineer |
| `POST` | `/assign/manual` | **lead/manager.** Assign a bug to a specific engineer |
| `DELETE` | `/assign/:bugId` | **lead/manager.** Unassign a bug |
| `GET` | `/priority` | Get the current priority queue |
| `GET` | `/analytics` | Get team-wide stats: totals, severity/status breakdowns, module hotspots |
| `POST` | `/users` | **lead/manager.** Create an engineer/user directly (no invite) |
| `GET` | `/users` | List users in your organization |
| `GET` | `/users/:id` | Get a single user |
| `PATCH` | `/users/:id/availability` | Toggle availability — your own, or any user's if lead/manager |
| `GET` | `/notifications` | List your recent notifications and how many are unread |
| `PATCH` | `/notifications/:id/read` | Mark one notification read |
| `POST` | `/notifications/read-all` | Mark all notifications read |

Example — submitting a bug:

```json
POST /api/bugs
{
  "title": "Login crash",
  "description": "App crashes on login",
  "module": "auth",
  "environment": "production"
}
```

```json
{
  "success": true,
  "data": {
    "bugId": "clx1a2b3c",
    "severity": { "score": 85, "label": "Critical" },
    "duplicates": [
      { "bugId": "clx0z9y8x", "title": "App crashes when logging in", "similarity": 0.82 }
    ]
  }
}
```

## 🚀 Getting started

### Prerequisites

- Node.js v20+
- A PostgreSQL database

### Backend setup

```bash
cd server
npm install

cp .env.example .env
# then fill in .env — see Environment variables below

npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed   # optional — adds two demo teams you can log into right away
npm run dev            # starts the API on http://localhost:4000
```

If you seed the database, every demo account shares the password `changeme123`. Two ready-made logins:
- `jordan@fixflow.dev` — manager of "FixFlow Labs" (the full demo: 5 engineers, 8 bugs)
- `rae@nimbusrobotics.dev` — manager of "Nimbus Robotics" (a small second team, so you can see that the two teams' data never overlaps)

### Frontend setup

```bash
cd client
npm install

cp .env.example .env.local
# then fill in .env.local — see Environment variables below

npm run dev           # starts the Next.js app on http://localhost:3000
```

## 🔐 Environment variables

Both `server/` and `client/` have a `.env.example` file with every variable explained inline — copy it and fill in real values rather than retyping from scratch.

**`server/.env`**

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `4000` |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma) | — |
| `JWT_SECRET` | Secret used to sign login tokens. **Must** be overridden in production — the server refuses to start with the default value when `NODE_ENV=production`. | `dev-secret-change-in-production` |
| `JWT_EXPIRES_IN` | How long a login session lasts | `12h` |
| `FRONTEND_URL` | The one origin the API accepts requests from (CORS) | `http://localhost:3000` |

**`client/.env.local`**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the FixFlow API, including `/api` (e.g. `http://localhost:4000/api`) |

## Available scripts

**Server** (`server/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Run the API with hot reload |
| `npm run build` | Regenerate the Prisma client, then compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run the automated test suite |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create and apply a migration in development (interactive) |
| `npm run prisma:deploy` | Apply pending migrations non-interactively — use this one in CI/production, never `prisma:migrate` |
| `npm run prisma:studio` | Open Prisma Studio (a visual database browser) |
| `npm run prisma:seed` | Wipe and reseed the database with two demo teams |

**Client** (`client/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start the production build |
| `npm run lint` | Run ESLint |

## Design system

The frontend follows a dark-only, "engineering command center" aesthetic — deep dark surfaces, neon blue/red/yellow accents used sparingly for status and emphasis, monospace type for technical metadata (bug IDs, timestamps, module tags), and restrained motion. Full design tokens, component specs, and page-level layout guidance live in [`client/DESIGN.md`](./client/DESIGN.md).
