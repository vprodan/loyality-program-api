import { describe, it, expect, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { LastSequenceStore } from "../../../src/utils/last-sequence.store.js";

describe("LastSequenceStore", () => {
  let redis: Redis;
  let store: LastSequenceStore;
  const eventId = "test-event-123";

  beforeEach(() => {
    redis = {
      get: vi.fn(),
      incrby: vi.fn(),
    } as unknown as Redis;

    store = new LastSequenceStore(redis);
  });

  describe("getKey", () => {
    it("should generate key with correct prefix", () => {
      const key = (store as any).getKey(eventId);
      expect(key).toBe("last-sequence:test-event-123");
    });

    it("should handle empty eventId", () => {
      const key = (store as any).getKey("");
      expect(key).toBe("last-sequence:");
    });

    it("should handle special characters in eventId", () => {
      const key = (store as any).getKey("test/event:123");
      expect(key).toBe("last-sequence:test/event:123");
    });
  });

  describe("get", () => {
    it("should return parsed sequence when exists", async () => {
      vi.mocked(redis.get).mockResolvedValue("42");
      const sequence = await store.get(eventId);
      expect(sequence).toBe(42);
      expect(redis.get).toHaveBeenCalledWith("last-sequence:test-event-123");
    });

    it("should return 0 when sequence does not exist", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      const sequence = await store.get(eventId);
      expect(sequence).toBe(0);
    });

    it("should handle undefined sequence value", async () => {
      vi.mocked(redis.get).mockResolvedValue(undefined as any);
      const sequence = await store.get(eventId);
      expect(sequence).toBe(0);
    });
  });

  describe("increment", () => {
    it("should increment by 1 by default", async () => {
      vi.mocked(redis.incrby).mockResolvedValue(1);
      const result = await store.increment(eventId);
      expect(result).toBe(1);
      expect(redis.incrby).toHaveBeenCalledWith("last-sequence:test-event-123", 1);
    });

    it("should increment by specified value", async () => {
      vi.mocked(redis.incrby).mockResolvedValue(5);
      const result = await store.increment(eventId, 5);
      expect(result).toBe(5);
      expect(redis.incrby).toHaveBeenCalledWith("last-sequence:test-event-123", 5);
    });

    it("should handle negative increment values", async () => {
      vi.mocked(redis.incrby).mockResolvedValue(-3);
      const result = await store.increment(eventId, -3);
      expect(result).toBe(-3);
      expect(redis.incrby).toHaveBeenCalledWith("last-sequence:test-event-123", -3);
    });
  });
});
