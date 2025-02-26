import { Redis } from "ioredis";

export interface EventStreamConsumerHandler<T> {
  (id: string, event: T): Promise<void>;
}

type EventBuffer<T> = [string, T][];

export class EventStreamConsumer<T> {
  // To control the consumer loop
  private shouldStop = false;
  private lastId = "0"; // Start reading from the beginning

  constructor(
    private readonly redis: Redis,
    private readonly streamName: string,
    private readonly blockTime: number = 5000,
  ) {}

  /**
   * Start consuming events from the stream
   * @important Blocks event loop
   */
  async start(handler: EventStreamConsumerHandler<T>) {
    while (this.shouldStop === false) {
      const buffer = await this.read();
      for (const [id, event] of buffer) {
        await handler(id, event).catch(() => {
          // Skipping all handler errors
        });
      }
    }
  }

  private async read(): Promise<EventBuffer<T>> {
    const stream = await this.redis
      .xread("BLOCK", this.blockTime, "STREAMS", this.streamName, this.lastId)
      // We are reading from a single stream
      .then((streams) => streams?.[0]);

    const buffer: EventBuffer<T> = [];

    if (stream) {
      const messages = stream[1]; // [name, messages[]]
      for (const [id, fields] of messages) {
        this.lastId = id;
        try {
          buffer.push([id, JSON.parse(fields[1]) as T]);
        } catch (err: unknown) {
          if (err instanceof Error) {
            // Acknowledge invalid event, remove from stream
            await this.ack(id);
          }
        }
      }
    }

    return buffer;
  }

  async ack(id: string) {
    await this.redis.xdel(this.streamName, id);
  }
}
