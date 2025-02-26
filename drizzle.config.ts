import "dotenv/config";
import { defineConfig } from "drizzle-kit";

import dbConfig from "./src/configs/db.config";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: dbConfig,
});
