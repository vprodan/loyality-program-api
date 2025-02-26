import "dotenv/config";
import loggerInstance from "@utils/logger.js";
import { drizzle } from "drizzle-orm/node-postgres";

import dbConfig from "../configs/db.config.js";

const logger = loggerInstance.child({}, { msgPrefix: "[DB] " });

export const db = drizzle({
  connection: dbConfig,
  logger:
    process.env.NODE_ENV === "dev"
      ? {
          logQuery: (query, params) => logger.debug(`Query: ${query}\nParams: ${params}`),
        }
      : undefined,
});
