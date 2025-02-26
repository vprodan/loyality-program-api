import "dotenv/config";
import cluster from "cluster";

import { build } from "@api/index.js";
import webhookEventConsumerService from "@services/webhook-event-consumer.service.js";

/**
 * Doing fork to handle webhook events in separate thread.
 * Consider to use a worker_thread/cluster or a separate service for this
 */
if (cluster.isPrimary) {
  const api = build();

  try {
    await api.listen({
      host: process.env.HOST ?? "0.0.0.0",
      port: +(process.env.PORT ?? 3000),
    });
    cluster.fork();

    cluster.on("exit", (worker, code, signal) => {
      api.log.error(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      api.log.info("Starting a new worker");
      cluster.fork();
    });
  } catch (err) {
    api.log.error(err);
    throw err;
  }
} else {
  // Consuming webhook events
  await webhookEventConsumerService.start();
}
