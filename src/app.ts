import "dotenv/config";
import fastify from "fastify";

import pointsConsume from "./api/points-consume.js";
import pointsGet from "./api/points-get.js";
import webhook from "./api/webhook.js";

export function build() {
  const app = fastify({
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

  if (process.env.NODE_ENV === "dev") {
    app.register(import("@fastify/swagger"), {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "Loyality Program API",
          description: "API for the loyality program",
          version: "1.0.0",
        },
        servers: [
          {
            url: "http://localhost:3000",
            description: "Development Server",
          },
        ],
      },
    });
    app.register(import("@fastify/swagger-ui"));

    app.ready().then(() => {
      app.log.info(`Swagger documentation available at /documentation`);
    });
  }

  app.register(webhook);
  app.register(pointsConsume);
  app.register(pointsGet);

  return app;
}
