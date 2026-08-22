import dotenv from "dotenv";
dotenv.config();

const DEFAULT_JWT_SECRET = "dev-secret-change-in-production";

export const env = {
  PORT: parseInt(process.env["PORT"] ?? "4000", 10),
  DATABASE_URL: process.env["DATABASE_URL"] ?? "",
  JWT_SECRET: process.env["JWT_SECRET"] ?? DEFAULT_JWT_SECRET,
  JWT_EXPIRES_IN: process.env["JWT_EXPIRES_IN"] ?? "12h",
  // Origin the API accepts requests from — locked down instead of allowing every site.
  FRONTEND_URL: process.env["FRONTEND_URL"] ?? "http://localhost:3000",
  NODE_ENV: process.env["NODE_ENV"] ?? "development",
} as const;

// Fail loudly at startup rather than silently signing production tokens with
// a secret that's published in this repo's README.
if (env.NODE_ENV === "production" && env.JWT_SECRET === DEFAULT_JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is still the default placeholder value. Set a real, private JWT_SECRET before running in production.",
  );
}
