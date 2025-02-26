import { describe, it, expect, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { EventStreamProducer } from "../../../src/utils/event-stream.producer.js";

describe("EventStreamProducer", () => {
  let redis: Redis;
  let producer: EventStreamProducer<any>;
  let streamName = "test-stream";

  beforeEach(() => {
    redis = {
      xadd: vi.fn(),
    } as unknown as Redis;

    producer = new EventStreamProducer(redis, streamName);
  });

  describe("produce", () => {
    it("should produce string event to stream", async () => {
      const event = "test-event";
      await producer.produce(event);
      expect(redis.xadd).toHaveBeenCalledWith(streamName, "*", "Payload", JSON.stringify(event));
    });

    it("should produce object event to stream", async () => {
      const event = { id: "test-id", name: "test-name" };
      await producer.produce(event);
      expect(redis.xadd).toHaveBeenCalledWith(streamName, "*", "Payload", JSON.stringify(event));
    });

    it("should produce number event to stream", async () => {
      const event = 42;
      await producer.produce(event);
      expect(redis.xadd).toHaveBeenCalledWith(streamName, "*", "Payload", JSON.stringify(event));
    });
  });
});
