import loyalityPointsService from "@services/loyality-points.service.js";
import type { FastifyInstance, FastifySchema, FastifyRequest } from "fastify";

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
  response: {
    200: {
      type: "object",
      properties: {
        pointsAvailable: { type: "integer" },
      },
    },
  },
};

async function handler(
  this: FastifyInstance,
  request: FastifyRequest<{ Params: { customerId: string } }>,
): Promise<Response> {
  const customerId = request.params.customerId;
  const pointsAvailable = await loyalityPointsService.getAvailable(customerId);

  return { pointsAvailable };
}

export default function routes(app: FastifyInstance) {
  app.get("/:customerId/points", { schema, handler });
}
