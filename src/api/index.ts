import "dotenv/config";
import pointsConsume from "@api/points-consume.js";
import pointsGet from "@api/points-get.js";
import webhook from "@api/webhook.js";
import loggerInstance from "@utils/logger.js";
import fastify from "fastify";

export function build() {
  const app = fastify({
    ignoreTrailingSlash: true,
    loggerInstance,
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
