import { EventStreamProducer } from "@utils/event-stream.producer.js";
import { Redis } from "ioredis";

import redisStreamConfig from "../configs/redis-stream.config.js";
import redisConfig from "../configs/redis.config.js";

class WebhookEventProduserService {
  private readonly producer: EventStreamProducer<WebhookEvent>;

  constructor() {
    this.producer = new EventStreamProducer<WebhookEvent>(
      new Redis(redisConfig),
      redisStreamConfig.streamName,
    );
  }

  async produce(event: WebhookEvent): Promise<void> {
    await this.producer.produce(event);
  }
}

export default new WebhookEventProduserService();
