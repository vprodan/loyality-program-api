import Fastify from "fastify";
import { describe, it, vi, expect, beforeEach } from "vitest";

import { build } from "../../../src/api/index.js";
import loggerInstance from "../../../src/utils/logger.js";

vi.mock("dotenv/config", () => ({}));

vi.mock("fastify", () => ({
  default: vi.fn(() => ({
    register: vi.fn(),
  })),
}));

vi.mock("@fastify/swagger", () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock("@fastify/swagger-ui", () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock("../../../src/utils/logger.ts", () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock("../../../src/api/webhook.js", () => ({ default: vi.fn() }));
vi.mock("../../../src/api/webhook.js", () => ({ default: vi.fn() }));
vi.mock("../../../src/api/points-consume.js", () => ({ default: vi.fn() }));
vi.mock("../../../src/api/points-get.js", () => ({ default: vi.fn() }));

describe("App initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.LOG_LEVEL;
  });

  it("should create Fastify instance with correct config", () => {
    build();

    expect(Fastify).toHaveBeenCalledWith(expect.objectContaining({ loggerInstance }));
  });
});
