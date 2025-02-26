import "dotenv/config";

export default {
  streamName: process.env.REDIS_STREAM_NAME ?? "stream-events",
};
