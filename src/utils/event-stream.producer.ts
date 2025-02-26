import { Redis } from "ioredis";

export class EventStreamProducer<T> {
  constructor(
    private readonly redis: Redis,
    private readonly streamName: string,
  ) {}

  async produce(event: T): Promise<void> {
    await this.redis.xadd(this.streamName, "*", "Payload", JSON.stringify(event));
  }
}
