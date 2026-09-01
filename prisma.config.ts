import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (non-pooled) connection — required by Prisma Migrate/introspection.
    // The app itself connects via the pooled DATABASE_URL, wired up separately
    // in src/lib/db/prisma.ts through @prisma/adapter-pg.
    url: env("DIRECT_URL"),
  },
});
