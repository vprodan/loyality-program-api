import type { FastifyInstance, FastifySchema, FastifyRequest } from "fastify";

import loyalityPointsService from "../services/loyality-points.service.js";

interface Response {
  pointsAvailable: number;
}

const schema: FastifySchema = {
  params: {
    type: "object",
    properties: {
      customerId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        pointsAvailable: { type: "integer" },
      },
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
  },
};
async function handler(
  this: FastifyInstance,
  request: FastifyRequest<{ Params: { customerId: string } }>,
): Promise<Response> {
  const customerId = request.params.customerId;
  const pointsAvailable = await loyalityPointsService.getPoints(customerId);

  return { pointsAvailable };
}

export default function routes(app: FastifyInstance) {
  app.get("/:customerId/points", { schema, handler });
}
