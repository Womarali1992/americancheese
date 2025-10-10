import { defineConfig } from "drizzle-kit";

if (!process.env.DB_PASSWORD) {
  console.warn("DB_PASSWORD not set. Database migrations will not be available.");
  console.warn("To enable database features, create a .env file with your DB credentials.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "project_management",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    ssl: false,
  },
});
