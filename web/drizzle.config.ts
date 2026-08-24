import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    const content = readFileSync(".env.local", "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {}
}

loadEnvLocal();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
