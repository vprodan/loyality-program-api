import { Redis } from "ioredis";

export class LastSequenceStore {
  private readonly prefix = "last-sequence" as const;

  constructor(private readonly redis: Redis) {}

  async get(eventId: string): Promise<number> {
    const key = this.getKey(eventId);

    return this.redis.get(key).then((seq) => (seq ? parseInt(seq) : 0));
  }

  async increment(eventId: string, value: number = 1): Promise<number> {
    const key = this.getKey(eventId);

    return this.redis.incrby(key, value);
  }

  private getKey(eventId: string) {
    return `${this.prefix}:${eventId}`;
  }
}
