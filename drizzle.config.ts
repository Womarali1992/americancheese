import { defineConfig } from "drizzle-kit";

if (!process.env.DB_PASSWORD) {
  throw new Error("DB_PASSWORD is required for PostgreSQL connection");
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
    password: process.env.DB_PASSWORD,
    ssl: false,
  },
});
