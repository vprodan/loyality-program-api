import cluster from "cluster";

import { describe, it, vi, expect, beforeEach } from "vitest";

import { build } from "../../src/app.js";
import eventStreamService from "../../src/services/event-stream.service.js";

vi.mock("dotenv/config", () => ({}));

vi.mock("cluster", () => ({
  default: {
    isPrimary: true,
    fork: vi.fn(),
    on: vi.fn(),
  },
}));

const mockedChildLogger = vi.fn();
const mockedAppLog = {
  error: vi.fn(),
  info: vi.fn(),
  child: vi.fn().mockImplementation(() => mockedChildLogger),
};
const mockedApp = {
  listen: vi.fn(),
  log: mockedAppLog,
};

vi.mock("../src/app.js", () => ({
  build: vi.fn(() => mockedApp),
}));

vi.mock("../src/services/event-stream.service.js", () => ({
  default: {
    consumeEvents: vi.fn(),
  },
}));

describe("Server initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.HOST;
    delete process.env.PORT;
  });

  it("should start server and fork worker when primary", async () => {
    await import("../../src/index.js");

    expect(build).toHaveBeenCalled();
    expect(mockedApp.listen).toHaveBeenCalledWith({
      host: "0.0.0.0",
      port: 3000,
    });
    expect(cluster.fork).toHaveBeenCalled();
  });

  it("should use environment variables when provided", async () => {
    process.env.HOST = "localhost";
    process.env.PORT = "4000";

    await import("../../src/index.js");

    expect(mockedApp.listen).toHaveBeenCalledWith({
      host: "localhost",
      port: 4000,
    });
  });

  it("should handle worker process exit", async () => {
    await import("../../src/index.js");

    const exitCallback = vi.mocked(cluster.on).mock.calls[0][1] as (...args) => void;
    exitCallback({ process: { pid: 1 } }, 1, "SIGTERM");

    expect(mockedApp.log.error).toHaveBeenCalled();
    expect(mockedApp.log.info).toHaveBeenCalled();
    expect(cluster.fork).toHaveBeenCalledTimes(2);
  });

  it("should start event consumer when worker", async () => {
    vi.spyOn(cluster, "isPrimary", "get").mockReturnValue(false);

    await import("../../src/index.js");

    expect(build).toHaveBeenCalled();
    expect(mockedApp.listen).not.toHaveBeenCalled();
    expect(eventStreamService.consumeEvents).toHaveBeenCalledWith(mockedChildLogger);
  });

  it("should handle server errors properly", async () => {
    const app = build();
    const mockError = new Error("Server error");
    vi.mocked(app.listen).mockRejectedValueOnce(mockError);

    try {
      await import("../../src/index.js");
    } catch (error) {
      expect(error).toBe(mockError);
      expect(app.log.error).toHaveBeenCalledWith(mockError);
    }
  });
});
