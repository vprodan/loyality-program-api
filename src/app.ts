import "dotenv/config";
import Fastify from "fastify";

import pointsConsume from "./api/points-consume.js";
import pointsGet from "./api/points-get.js";
import webhook from "./api/webhook.js";

export function build() {
  const app = Fastify({
    ignoreTrailingSlash: true,
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport: {
        target: "@fastify/one-line-logger",
        options: {
          colorize: true,
        },
      },
    },
  });

  app.register(webhook);
  app.register(pointsConsume);
  app.register(pointsGet);

  return app;
}
