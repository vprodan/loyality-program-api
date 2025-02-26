import Fastify from "fastify";
import { describe, it, expect, vi, beforeEach } from "vitest";

import route from "../../../src/api/points-consume.js";
import loyalityPointsService from "../../../src/services/loyality-points.service.js";

// Mock the loyalityPointsService
vi.mock("../../../src/services/loyality-points.service.js", () => ({
  default: {
    consume: vi.fn(),
  },
}));

describe("Points Consume API Schema Validation", () => {
  let app;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    app = Fastify();
    await app.register(route);
    await app.ready();
  });

  it("should accept valid request with proper UUID and points", async () => {
    vi.mocked(loyalityPointsService).consume.mockResolvedValueOnce(100);
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const points = 100;
    const response = await app.inject().post(`/${id}/consume`).payload({ points });

    expect(response.statusCode).toBe(200);
    expect(loyalityPointsService.consume).toHaveBeenCalledWith(id, points);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("pointsAvailable");
    expect(typeof body.pointsAvailable).toBe("number");
  });

  it("should reject request with invalid UUID format", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/invalid-uuid/consume",
      payload: {
        points: 100,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should reject request without points field", async () => {
    const response = await app
      .inject()
      .post("/123e4567-e89b-12d3-a456-426614174000/consume")
      .payload({});

    expect(response.statusCode).toBe(400);
  });

  it("should reject request with non-integer points", async () => {
    const response = await app
      .inject()
      .post("/123e4567-e89b-12d3-a456-426614174000/consume")
      .payload({ points: "100s" });

    expect(response.statusCode).toBe(400);
  });

  it("should reject request with floating point number for points", async () => {
    const response = await app
      .inject()
      .post("/123e4567-e89b-12d3-a456-426614174000/consume")
      .payload({ points: 100.5 });

    expect(response.statusCode).toBe(400);
  });

  it("should return 422 when service throws an error", async () => {
    vi.mocked(loyalityPointsService).consume.mockRejectedValueOnce({
      statusCode: 422,
      message: "Not enough points",
    });

    const response = await app
      .inject()
      .post("/123e4567-e89b-12d3-a456-426614174000/consume")
      .payload({ points: 100 });

    expect(response.statusCode).toBe(422);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });
});
