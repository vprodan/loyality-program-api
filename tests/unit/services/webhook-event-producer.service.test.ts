import { describe, it, expect, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { EventStreamProducer } from "../../../src/utils/event-stream.producer.js";

// Mock dependencies before importing the service
vi.mock("ioredis");
vi.mock("../../../src/utils/event-stream.producer.js");

// Import after mocks are set up
import WebhookEventProduserService from "../../../src/services/webhook-event-producer.service.js";

describe("WebhookEventProducerService", () => {
  let mockProducer: EventStreamProducer<any>;
  let service: any; // type 'any' to access private properties for testing

  beforeEach(() => {
    vi.resetAllMocks();

    mockProducer = {
      produce: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventStreamProducer<any>;

    // Replace the producer in the service with our mock
    service = WebhookEventProduserService as any;
    service.producer = mockProducer;
  });

  describe("produce", () => {
    it("should forward the event to the EventStreamProducer", async () => {
      const testEvent = {
        EntityName: "Order",
        EventName: "OrderPlaced",
        Sequence: 1,
        Payload: {
          OrderId: "order-123",
          CustomerId: "customer-456",
          TotalOrderAmount: 100,
        },
      };

      await service.produce(testEvent);

      expect(mockProducer.produce).toHaveBeenCalledTimes(1);
      expect(mockProducer.produce).toHaveBeenCalledWith(testEvent);
    });

    it("should handle customer events", async () => {
      const testEvent = {
        EntityName: "Customer",
        EventName: "CustomerDeleted",
        Sequence: 1,
        Payload: {
          CustomerId: "customer-456",
        },
      };

      await service.produce(testEvent);

      expect(mockProducer.produce).toHaveBeenCalledTimes(1);
      expect(mockProducer.produce).toHaveBeenCalledWith(testEvent);
    });

    it("should propagate errors from the producer", async () => {
      const error = new Error("Test producer error");
      vi.mocked(mockProducer.produce).mockRejectedValueOnce(error);

      const testEvent = {
        EntityName: "Order",
        EventName: "OrderCanceled",
        Sequence: 1,
        Payload: {
          OrderId: "order-123",
        },
      };

      await expect(service.produce(testEvent)).rejects.toThrow("Test producer error");
      expect(mockProducer.produce).toHaveBeenCalledWith(testEvent);
    });
  });
});
