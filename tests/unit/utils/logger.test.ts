import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPino = vi.fn();
vi.mock("pino", () => ({
  pino: mockPino,
}));

const mockLoggerConfig = {
  level: "info",
  timestamp: true,
};
vi.mock("../../../src/configs/logger.config.js", () => ({
  default: mockLoggerConfig,
}));

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should create pino logger with config", async () => {
    // Import logger after mocks are set up
    await import("../../../src/utils/logger.js");

    expect(mockPino).toHaveBeenCalledTimes(1);
    expect(mockPino).toHaveBeenCalledWith(mockLoggerConfig);
  });

  it("should export pino instance", async () => {
    const mockLogger = { info: vi.fn(), error: vi.fn() };
    mockPino.mockReturnValue(mockLogger);

    const logger = (await import("../../../src/utils/logger.js")).default;

    expect(logger).toBe(mockLogger);
  });

  it("should use correct config object", async () => {
    await import("../../../src/utils/logger.js");

    const configPassedToPino = mockPino.mock.calls[0][0];
    expect(configPassedToPino).toEqual(mockLoggerConfig);
    expect(configPassedToPino).toBe(mockLoggerConfig);
  });
});
