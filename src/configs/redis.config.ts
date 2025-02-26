import "dotenv/config";
import { RedisOptions } from "ioredis";

export default {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? +process.env.REDIS_PORT : undefined,
} satisfies RedisOptions;
