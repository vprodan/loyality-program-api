import { describe, it, expect, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { EventStreamConsumer } from "../../../src/utils/event-stream.consumer.js";
import { LastSequenceStore } from "../../../src/utils/last-sequence.store.js";
import loyalityPointsService from "../../../src/services/loyality-points.service.js";

// Need to mock before importing service that uses them
vi.mock("ioredis");
vi.mock("../../../src/utils/event-stream.consumer.js");
vi.mock("../../../src/utils/last-sequence.store.js");
vi.mock("../../../src/services/loyality-points.service.js");
vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Import after mocks are set up
import WebhookEventConsumerService from "../../../src/services/webhook-event-consumer.service.js";

describe("WebhookEventConsumerService", () => {
  let mockConsumer: EventStreamConsumer<any>;
  let mockLastSequence: LastSequenceStore;
  let service: any; // to access private methods for testing

  beforeEach(() => {
    vi.resetAllMocks();

    mockConsumer = {
      start: vi.fn(),
      ack: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventStreamConsumer<any>;

    mockLastSequence = {
      get: vi.fn(),
      increment: vi.fn(),
    } as unknown as LastSequenceStore;

    // Replace the consumer and lastSequence in the service with our mocks
    service = WebhookEventConsumerService as any;
    service.consumer = mockConsumer;
    service.lastSequence = mockLastSequence;

    // Reset the delayed events map
    service.delayedEventsMap = new Map();
  });

  describe("start", () => {
    it("should start the consumer with the event handler", async () => {
      await service.start();
      expect(mockConsumer.start).toHaveBeenCalledWith(service.handler);
    });
  });

  describe("handler", () => {
    describe("when sequence matches next expected sequence", () => {
      it("should immediately consume the event and acknowledge it", async () => {
        const event = createOrderPlacedEvent(1);
        vi.mocked(mockLastSequence.get).mockResolvedValue(0);

        await service.handler("message-id", event);

        expect(mockLastSequence.get).toHaveBeenCalledWith("Order:order-123");
        expect(loyalityPointsService.orderPlaced).toHaveBeenCalledWith(
          "customer-123",
          "order-123",
          100,
        );
        expect(mockLastSequence.increment).toHaveBeenCalledWith("Order:order-123");
        expect(mockConsumer.ack).toHaveBeenCalledWith("message-id");
      });
    });

    describe("when sequence is already processed", () => {
      it("should skip the event and just acknowledge it", async () => {
        const event = createOrderPlacedEvent(1);
        vi.mocked(mockLastSequence.get).mockResolvedValue(1); // Already processed sequence 1

        await service.handler("message-id", event);

        expect(mockLastSequence.get).toHaveBeenCalledWith("Order:order-123");
        expect(loyalityPointsService.orderPlaced).not.toHaveBeenCalled();
        expect(mockLastSequence.increment).not.toHaveBeenCalled();
        expect(mockConsumer.ack).toHaveBeenCalledWith("message-id");
      });
    });

    describe("when sequence is higher than expected", () => {
      it("should add to delayed events and acknowledge", async () => {
        const event = createOrderPlacedEvent(2); // Sequence 2
        vi.mocked(mockLastSequence.get).mockResolvedValue(0); // Expecting sequence 1

        await service.handler("message-id", event);

        expect(mockLastSequence.get).toHaveBeenCalledWith("Order:order-123");
        expect(loyalityPointsService.orderPlaced).not.toHaveBeenCalled();
        expect(mockLastSequence.increment).not.toHaveBeenCalled();
        expect(mockConsumer.ack).not.toHaveBeenCalled();

        // Check the delayed events map
        const delayed = service.delayedEventsMap.get("Order:order-123");
        expect(delayed[2]).toEqual(["message-id", event]);
      });
    });

    describe("when processing an event in sequence after a delayed event", () => {
      it("should process the current event and then the delayed event", async () => {
        // First add a delayed event with sequence 2
        const delayedEvent = createOrderPlacedEvent(2);
        service.delayedEventsMap.set("Order:order-123", []);
        service.delayedEventsMap.get("Order:order-123")[2] = ["delayed-id", delayedEvent];

        // Now process an event with sequence 1
        const event = createOrderPlacedEvent(1);
        vi.mocked(mockLastSequence.get).mockResolvedValue(0);

        await service.handler("message-id", event);

        expect(loyalityPointsService.orderPlaced).toHaveBeenCalledTimes(2);
        expect(mockLastSequence.increment).toHaveBeenCalledTimes(2);
        expect(mockConsumer.ack).toHaveBeenCalledWith("message-id");
        expect(mockConsumer.ack).toHaveBeenCalledWith("delayed-id");
      });
    });
  });

  describe("consumeEvent", () => {
    it("should handle CustomerDeleted event", async () => {
      const event = {
        EntityName: "Customer",
        EventName: "CustomerDeleted",
        Sequence: 1,
        Payload: { CustomerId: "customer-123" },
      };

      await service.consumeEvent(event);

      expect(loyalityPointsService.customerRemoved).toHaveBeenCalledWith("customer-123");
    });

    it("should handle OrderPlaced event", async () => {
      const event = createOrderPlacedEvent(1);

      await service.consumeEvent(event);

      expect(loyalityPointsService.orderPlaced).toHaveBeenCalledWith(
        "customer-123",
        "order-123",
        100,
      );
    });

    it("should handle OrderCanceled event", async () => {
      const event = {
        EntityName: "Order",
        EventName: "OrderCanceled",
        Sequence: 1,
        Payload: { OrderId: "order-123", CustomerId: "customer-123" },
      };

      await service.consumeEvent(event);

      expect(loyalityPointsService.orderCancelled).toHaveBeenCalledWith("order-123");
    });

    it("should handle OrderReturned event", async () => {
      const event = {
        EntityName: "Order",
        EventName: "OrderReturned",
        Sequence: 1,
        Payload: { OrderId: "order-123", CustomerId: "customer-123" },
      };

      await service.consumeEvent(event);

      expect(loyalityPointsService.orderCancelled).toHaveBeenCalledWith("order-123");
    });

    it("should ignore CustomerCreated event", async () => {
      const event = {
        EntityName: "Customer",
        EventName: "CustomerCreated",
        Sequence: 1,
        Payload: { CustomerId: "customer-123" },
      };

      await service.consumeEvent(event);

      expect(loyalityPointsService.customerRemoved).not.toHaveBeenCalled();
      expect(loyalityPointsService.orderPlaced).not.toHaveBeenCalled();
      expect(loyalityPointsService.orderCancelled).not.toHaveBeenCalled();
    });

    it("should throw error for invalid event", async () => {
      const event = {
        EntityName: "Unknown",
        EventName: "Unknown",
        Sequence: 1,
        Payload: {},
      };

      await expect(service.consumeEvent(event)).rejects.toThrow("Invalid event:");
    });
  });

  describe("helper methods", () => {
    describe("getEntityId", () => {
      it("should return CustomerId for Customer events", () => {
        const event = {
          EntityName: "Customer",
          Payload: { CustomerId: "customer-123" },
        };

        expect(service.getEntityId(event)).toBe("customer-123");
      });

      it("should return OrderId for Order events", () => {
        const event = {
          EntityName: "Order",
          Payload: { OrderId: "order-123" },
        };

        expect(service.getEntityId(event)).toBe("order-123");
      });

      it("should return undefined for unknown entity", () => {
        const event = {
          EntityName: "Unknown",
          Payload: {},
        };

        expect(service.getEntityId(event)).toBeUndefined();
      });
    });

    describe("getEventId", () => {
      it("should return EntityName:entityId format", () => {
        const event = {
          EntityName: "Order",
          Payload: { OrderId: "order-123" },
        };

        expect(service.getEventId(event)).toBe("Order:order-123");
      });

      it("should return undefined for unknown entity", () => {
        const event = {
          EntityName: "Unknown",
          Payload: {},
        };

        expect(service.getEventId(event)).toBeUndefined();
      });
    });
  });
});

// Helper function to create test events
function createOrderPlacedEvent(sequence: number) {
  return {
    EntityName: "Order",
    EventName: "OrderPlaced",
    Sequence: sequence,
    Payload: {
      OrderId: "order-123",
      CustomerId: "customer-123",
      TotalOrderAmount: 100,
    },
  };
}
