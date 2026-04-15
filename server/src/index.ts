import { env } from "./config/env.js";
import app from "./app.js";
import prisma from "./config/database.js";

async function main() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📋 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
