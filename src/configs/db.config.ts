import "dotenv/config";
import { PoolConfig } from "pg";

export default {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  ssl: process.env.DB_SSL === "true",
} satisfies PoolConfig | string;
