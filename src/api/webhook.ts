import webhookEventProduserService from "@services/webhook-event-producer.service.js";
import type { FastifyInstance, FastifyRequest, FastifySchema } from "fastify";

const schema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      EventTime: { type: "string", format: "date-time" },
      EventName: { type: "string" },
      EntityName: { type: "string" },
      Sequence: { type: "integer" },
      Payload: { type: "object" },
    },
    required: ["EventTime", "EventName", "EntityName", "Sequence", "Payload"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
      },
    },
  },
};

async function handler(request: FastifyRequest<{ Body: WebhookEvent }>) {
  const event = request.body;
  await webhookEventProduserService.produce(event);

  return { success: true };
}

export default function routes(app: FastifyInstance) {
  app.post("/webhook", { schema, handler });
}
