import type { FastifyInstance, FastifyRequest, FastifySchema } from "fastify";

import loyalityPointsService from "../services/loyality-points.service.js";

interface Response {
  pointsAvailable: number;
}

const schema: FastifySchema = {
  params: {
    type: "object",
    properties: {
      customerId: { type: "string", format: "uuid" },
    },
  },
  body: {
    type: "object",
    required: ["points"],
    properties: {
      points: { type: "integer" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        pointsAvailable: { type: "integer" },
      },
    },
    422: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
  },
};

async function handler(
  this: FastifyInstance,
  request: FastifyRequest<{ Params: { customerId: string }; Body: { points: number } }>,
): Promise<Response> {
  const { customerId } = request.params;
  const { points } = request.body;

  const pointsAvailable = await loyalityPointsService.consumePoints(customerId, points);

  return { pointsAvailable };
}

export default function routes(app: FastifyInstance) {
  app.post("/:customerId/consume", { schema, handler });
}
