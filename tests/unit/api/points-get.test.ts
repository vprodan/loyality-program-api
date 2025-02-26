import Fastify from "fastify";
import { describe, it, expect, vi, beforeEach } from "vitest";

import route from "../../../src/api/points-get.js";
import loyalityPointsService from "../../../src/services/loyality-points.service.js";

// Mock the loyalityPointsService
vi.mock("../../../src/services/loyality-points.service.js", () => ({
  default: {
    getAvailable: vi.fn(),
  },
}));

describe("Points Get API Schema Validation", () => {
  let app;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    app = Fastify();
    await app.register(route);
    await app.ready();
  });

  it("should accept valid request with proper UUID and points", async () => {
    vi.mocked(loyalityPointsService).getAvailable.mockResolvedValueOnce(100);
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const response = await app.inject().get(`/${id}/points`);

    expect(response.statusCode).toBe(200);
    expect(loyalityPointsService.getAvailable).toHaveBeenCalledWith(id);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("pointsAvailable");
    expect(typeof body.pointsAvailable).toBe("number");
    expect(body.pointsAvailable).toBe(100);
  });

  it("should reject request with invalid UUID format", async () => {
    const response = await app.inject().get("/invalid-uuid/points");

    expect(response.statusCode).toBe(400);
  });
});
