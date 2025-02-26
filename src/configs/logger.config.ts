import "dotenv/config";
import { LoggerOptions } from "pino";

export default {
  level: process.env.LOG_LEVEL ?? "info",
  transport: {
    target: "@fastify/one-line-logger",
    options: {
      colorize: true,
    },
  },
} satisfies LoggerOptions;
