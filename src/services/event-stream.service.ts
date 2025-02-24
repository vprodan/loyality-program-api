import { FastifyBaseLogger } from "fastify";
import { Redis } from "ioredis";

import loyalityPointsService from "./loyality-points.service.js";
import { WebhookEvent } from "../../types/webhook-events.js";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? +process.env.REDIS_PORT : undefined,
});

const EVENT_STREAM = "event_stream";

const DELAYED_EVENTS_MAP = new Map<string, WebhookEvent[]>();
const DELAYED_EVENTS_ID_MAP = new Map<string, string[]>();

/**
 * Pushing incoming events to the queue
 */
function pushEvent(event: WebhookEvent) {
  return redis.xadd(EVENT_STREAM, `*`, "WebhookEvent", JSON.stringify(event));
}

/**
 * Consuming incoming events
 * better to use a worker_thread/cluster or a separate service for this
 */
async function consumeEvents(logger: FastifyBaseLogger) {
  logger.info("Event Worker started");

  // Read events from the stream
  async function readEvents(old = false) {
    const streams = await redis.xread("BLOCK", 5000, "STREAMS", EVENT_STREAM, old ? "0" : "$");

    if (streams) {
      const [, messages] = streams[0];
      for (const [id, fields] of messages) {
        try {
          const event = JSON.parse(fields[1]) as WebhookEvent;
          const entityId = getEntityId(event);
          if (entityId === undefined) {
            throw new Error("Invalid event");
          }

          const eventId = `${event.EntityName}:${entityId}`;
          const lastSequence = await redis.get(eventId).then((seq) => (seq ? parseInt(seq) : 0));
          const delayed = DELAYED_EVENTS_MAP.get(eventId) ?? [];
          const ids = DELAYED_EVENTS_ID_MAP.get(eventId) ?? [];
          let nextSequence = lastSequence + 1;

          if (event.Sequence <= lastSequence || delayed.at(event.Sequence)) {
            await redis.xdel(EVENT_STREAM, id);
            logger.debug(`Skipped event ${eventId}:${event.Sequence}`);
          } else if (event.Sequence === nextSequence) {
            try {
              await consumeEvent(event);
              logger.debug(`Consumed event imediately ${eventId}:${nextSequence}`);
              nextSequence++;
            } finally {
              await Promise.all([redis.incr(eventId), redis.xdel(EVENT_STREAM, id)]);
            }

            // Consuming delayed events
            let consumed = 0;
            while (delayed[nextSequence] !== undefined) {
              try {
                await consumeEvent(delayed[nextSequence]);
                logger.debug(`Consumed delayed event ${eventId}:${nextSequence}`);
              } finally {
                await Promise.all([
                  redis.incrby(eventId, consumed),
                  redis.xdel(EVENT_STREAM, ids[nextSequence]),
                ]).finally(() => {
                  delete delayed[nextSequence];
                  delete ids[nextSequence];

                  consumed++;
                  nextSequence++;
                });
              }
            }
          } else {
            if (!DELAYED_EVENTS_MAP.has(eventId)) {
              DELAYED_EVENTS_MAP.set(eventId, delayed);
              DELAYED_EVENTS_ID_MAP.set(eventId, ids);
            }

            delayed[event.Sequence] = event;
            ids[event.Sequence] = id;
            logger.debug(`Added to delayed events ${eventId}:${event.Sequence}`);
          }
        } catch (err: unknown) {
          await redis.xdel(EVENT_STREAM, id);
          if (err instanceof Error) {
            logger.error(`Error processing message ${id}: ${err.stack}`);
          }
        }
      }
    }
  }

  try {
    // Read old events
    await readEvents(true);

    // Read new events
    while (true) {
      await readEvents();
    }
  } catch (err) {
    logger.error("Fatal error:", err);
    redis.disconnect();
    throw err;
  }
}

function getEntityId(event: WebhookEvent) {
  if (event.EntityName === "Customer") {
    return event.Payload.CustomerId;
  }

  if (event.EntityName === "Order") {
    return event.Payload.OrderId;
  }
}

/**
 * Consume one event, will preserve in queue if error occured
 */
async function consumeEvent(event: WebhookEvent) {
  if (event.EntityName === "Customer") {
    switch (event.EventName) {
      case "CustomerCreated":
        // Ignoring
        break;
      case "CustomerDeleted":
        await loyalityPointsService.removePointsByCustomerId(event.Payload.CustomerId);
        break;
      default:
        throw new Error("Invalid event");
    }
  } else if (event.EntityName === "Order") {
    switch (event.EventName) {
      case "OrderPlaced": {
        const points = loyalityPointsService.calculatePoints(event.Payload.TotalOrderAmount);
        await loyalityPointsService.addPoints(
          event.Payload.CustomerId,
          event.Payload.OrderId,
          points,
        );

        break;
      }
      case "OrderReturned":
      case "OrderCanceled":
        await loyalityPointsService.removePointsByOrderId(event.Payload.OrderId);
        break;
      default:
        throw new Error("Invalid event");
    }
  } else {
    throw new Error("Invalid event");
  }
}

export default {
  pushEvent,
  consumeEvents,
  consumeEvent,
};
