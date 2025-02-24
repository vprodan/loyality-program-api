import Fastify from "fastify";
import { describe, it, vi, expect, beforeEach } from "vitest";

import { build } from "../../src/app.js";

vi.mock("dotenv/config", () => ({}));

vi.mock("fastify", () => ({
  default: vi.fn(() => ({
    register: vi.fn(),
  })),
}));

vi.mock("../src/api/webhook.js", () => ({ default: vi.fn() }));
vi.mock("../src/api/points-consume.js", () => ({ default: vi.fn() }));
vi.mock("../src/api/points-get.js", () => ({ default: vi.fn() }));

describe("App initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.LOG_LEVEL;
  });

  it("should create Fastify instance with correct config", () => {
    build();

    expect(Fastify).toHaveBeenCalledWith({
      ignoreTrailingSlash: true,
      logger: {
        level: "info",
        transport: {
          target: "@fastify/one-line-logger",
          options: {
            colorize: true,
          },
        },
      },
    });
  });

  it("should use custom log level from environment", () => {
    process.env.LOG_LEVEL = "debug";
    build();

    expect(Fastify).toHaveBeenCalledWith(
      expect.objectContaining({
        logger: expect.objectContaining({
          level: "debug",
        }),
      }),
    );
  });

  it("should register all routes", () => {
    const app = build();

    expect(app.register).toHaveBeenCalledTimes(3);
  });
});
