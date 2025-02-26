import loyalityPointsService from "@services/loyality-points.service.js";
import { EventStreamConsumer, EventStreamConsumerHandler } from "@utils/event-stream.consumer.js";
import { LastSequenceStore } from "@utils/last-sequence.store.js";
import loggerInstance from "@utils/logger.js";
import { Redis } from "ioredis";

import redisStreamConfig from "../configs/redis-stream.config.js";
import redisConfig from "../configs/redis.config.js";

type DelayedEvent = [string, WebhookEvent]; // [id, event]

class WebhookEventConsumerService {
  private readonly consumer: EventStreamConsumer<WebhookEvent>;
  private readonly logger = loggerInstance.child(
    {},
    { msgPrefix: "[WebhookEventConsumerService] " },
  );
  private readonly delayedEventsMap = new Map<string, DelayedEvent[]>();
  private readonly lastSequence: LastSequenceStore;
  // TODO: better to move this to a separate handler class
  private readonly handler: EventStreamConsumerHandler<WebhookEvent> = async (id, event) => {
    try {
      const eventId = this.getEventId(event);
      if (eventId === undefined) {
        throw new Error("Invalid event: " + JSON.stringify(event));
      }

      const lastSequence = await this.lastSequence.get(eventId);
      const delayed = this.getDelayedEvents(eventId);

      let nextSequence = lastSequence + 1;
      // Skipping events if already processed
      if (event.Sequence <= lastSequence || this.delayedHasSequence(delayed, event.Sequence)) {
        await this.consumer.ack(id);
        this.logger.debug(`Skipped event ${eventId}:${event.Sequence}`);
      } else if (event.Sequence === nextSequence) {
        // Consuming event immediately if it's next in needed sequence
        try {
          await this.consumeEvent(event);
          await this.lastSequence.increment(eventId);
          this.logger.debug(`Immediately consumed event ${eventId}:${nextSequence}`);
          nextSequence++;
        } finally {
          await this.consumer.ack(id);
        }

        // Consuming delayed events
        nextSequence += await this.consumeDelayedEvents(delayed, nextSequence);
      } else {
        // Adding to delayed events
        this.addDelayedEvents(eventId, delayed, [id, event]);
        this.logger.debug(`Added to delayed events ${eventId}:${event.Sequence}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`Error processing message ${id}: ${err.stack}\n${JSON.stringify(event)}`);
        await this.consumer.ack(id);
      }
    }
  };

  constructor() {
    this.consumer = new EventStreamConsumer<WebhookEvent>(
      new Redis(redisConfig),
      redisStreamConfig.streamName,
    );
    this.lastSequence = new LastSequenceStore(new Redis(redisConfig));
  }

  /**
   * Start consuming events
   * @important Blocks event loop
   */
  async start(): Promise<void> {
    this.logger.info("Starting consuming events...");
    return this.consumer.start(this.handler);
  }

  private async consumeEvent(event: WebhookEvent): Promise<void> {
    if (event.EntityName === "Customer") {
      switch (event.EventName) {
        case "CustomerCreated":
          // Ignoring as it is useless for us
          return;
        case "CustomerDeleted":
          await loyalityPointsService.customerRemoved(event.Payload.CustomerId);
          return;
      }
    } else if (event.EntityName === "Order") {
      switch (event.EventName) {
        case "OrderPlaced":
          await loyalityPointsService.orderPlaced(
            event.Payload.CustomerId,
            event.Payload.OrderId,
            event.Payload.TotalOrderAmount,
          );

          return;
        case "OrderReturned":
        case "OrderCanceled":
          await loyalityPointsService.orderCancelled(event.Payload.OrderId);
          return;
      }
    }

    throw new Error("Invalid event: " + JSON.stringify(event));
  }

  private async consumeDelayedEvents(delayedEvents: DelayedEvent[], startFrom: number) {
    let consumed = 0;
    let nextSequence = startFrom;

    let currentEvent: DelayedEvent;
    while ((currentEvent = delayedEvents[nextSequence]) !== undefined) {
      const [id, event] = currentEvent;

      try {
        await this.consumeEvent(event);
        await this.lastSequence.increment(this.getEventId(event)!, consumed);
        this.logger.debug(`Consumed delayed event ${id}:${nextSequence}`);
      } finally {
        await this.consumer.ack(id).finally(() => {
          delete delayedEvents[nextSequence]; // Cleanup

          consumed++;
          nextSequence++;
        });
      }
    }

    return consumed;
  }

  private getEntityId(event: WebhookEvent): string | undefined {
    if (event.EntityName === "Customer") {
      return event.Payload.CustomerId;
    }

    if (event.EntityName === "Order") {
      return event.Payload.OrderId;
    }
  }

  private getEventId(event: WebhookEvent): string | undefined {
    const entityId = this.getEntityId(event);
    if (entityId === undefined) {
      return undefined;
    }

    return `${event.EntityName}:${entityId}`;
  }

  private getDelayedEvents(eventId: string): DelayedEvent[] {
    return this.delayedEventsMap.get(eventId) ?? [];
  }

  private addDelayedEvents(eventId: string, delayedArray: DelayedEvent[], delayed: DelayedEvent) {
    if (!this.delayedEventsMap.has(eventId)) {
      this.delayedEventsMap.set(eventId, delayedArray);
    }

    const event = delayed[1]; // [id, event]

    delayedArray[event.Sequence] = delayed;
  }

  private delayedHasSequence(delayedArray: DelayedEvent[], sequence: number) {
    return delayedArray[sequence] !== undefined;
  }
}

export default new WebhookEventConsumerService();
