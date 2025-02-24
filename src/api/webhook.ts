import type { FastifyInstance } from "fastify";

import type { WebhookEvent } from "../../types/webhook-events.d.ts";
import { pushEvent } from "../services/event-stream.service.js";

export default function routes(app: FastifyInstance) {
  app.post("/webhook", async (request) => {
    const event = request.body as WebhookEvent;
    await pushEvent(event);

    return { success: true };
  });
}
