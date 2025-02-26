import Fastify from "fastify";
import { describe, it, expect, vi, beforeEach } from "vitest";

import route from "../../../src/api/webhook.js";
import webhookEventProduserService from "../../../src/services/webhook-event-producer.service.js";

// Mock the loyalityPointsService
vi.mock("../../../src/services/webhook-event-producer.service.js", () => ({
  default: {
    produce: vi.fn(),
  },
}));

describe("Webhook API Schema Validation", () => {
  let app;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    app = Fastify();
    await app.register(route);
    await app.ready();
  });

  it("should error when no payload", async () => {
    const response = await app.inject().post("/webhook");

    expect(webhookEventProduserService.produce).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it("should accept valid request with proper UUID and points", async () => {
    const payload = {
      EventTime: "2023-11-13T21:03:10Z",
      EventName: "CustomerCreated",
      EntityName: "Customer",
      Sequence: 1,
      Payload: {
        CustomerId: "814e496d-c6d1-49d5-b30b-359b4f83fa48",
      },
    };
    const response = await app.inject().post("/webhook").payload(payload);

    expect(webhookEventProduserService.produce).toHaveBeenCalledWith(payload);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("success");
    expect(typeof body.success).toBe("boolean");
    expect(body.success).toBe(true);
  });
});
