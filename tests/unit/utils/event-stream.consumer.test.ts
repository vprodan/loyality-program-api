import { describe, it, expect, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { EventStreamConsumer } from "../../../src/utils/event-stream.consumer.js";

describe("EventStreamConsumer", () => {
  let redis: Redis;
  let consumer: EventStreamConsumer<any>;
  let streamName = "test-stream";
  let blockTime = 1000;

  beforeEach(() => {
    redis = {
      xread: vi.fn(),
      xdel: vi.fn(),
    } as unknown as Redis;

    consumer = new EventStreamConsumer(redis, streamName, blockTime);
  });

  describe("start", () => {
    it("should process events from stream", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const mockEvent = { data: "test" };
      const mockId = "1234567890";

      // Mock first call returns data, second returns null to stop the loop
      vi.mocked(redis.xread).mockResolvedValueOnce([
        [streamName, [[mockId, ["Payload", JSON.stringify(mockEvent)]]]],
      ]);

      // Start consumer and immediately stop it
      const startPromise = consumer.start(handler);
      (consumer as any).shouldStop = true;
      await startPromise;

      expect(handler).toHaveBeenCalledWith(mockId, mockEvent);
      expect(redis.xread).toHaveBeenCalledWith("BLOCK", blockTime, "STREAMS", streamName, "0");
    });

    it("should handle handler errors gracefully", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Handler error"));
      const mockEvent = { data: "test" };
      const mockId = "1234567890";

      vi.mocked(redis.xread).mockResolvedValueOnce([
        [streamName, [[mockId, ["Payload", JSON.stringify(mockEvent)]]]],
      ]);

      const startPromise = consumer.start(handler);
      (consumer as any).shouldStop = true;
      await startPromise;

      expect(handler).toHaveBeenCalledWith(mockId, mockEvent);
      expect(redis.xread).toHaveBeenCalled();
    });

    it("should handle invalid JSON in events", async () => {
      const handler = vi.fn();
      const mockId = "1234567890";
      const invalidJson = "invalid-json";

      vi.mocked(redis.xread).mockResolvedValueOnce([
        [streamName, [[mockId, ["Payload", invalidJson]]]],
      ]);

      const startPromise = consumer.start(handler);
      (consumer as any).shouldStop = true;
      await startPromise;

      expect(handler).not.toHaveBeenCalled();
      expect(redis.xdel).toHaveBeenCalledWith(streamName, mockId);
    });
  });

  describe("read", () => {
    it("should handle empty stream response", async () => {
      vi.mocked(redis.xread).mockResolvedValueOnce(null);

      const result = await (consumer as any).read();

      expect(result).toEqual([]);
      expect(redis.xread).toHaveBeenCalled();
    });

    it("should update lastId after reading messages", async () => {
      const mockId = "1234567890";
      const mockEvent = { data: "test" };

      vi.mocked(redis.xread).mockResolvedValueOnce([
        [streamName, [[mockId, ["Payload", JSON.stringify(mockEvent)]]]],
      ]);

      await (consumer as any).read();

      expect((consumer as any).lastId).toBe(mockId);
    });
  });

  describe("ack", () => {
    it("should delete message from stream", async () => {
      const mockId = "1234567890";
      await consumer.ack(mockId);

      expect(redis.xdel).toHaveBeenCalledWith(streamName, mockId);
    });
  });
});
