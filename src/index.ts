import cluster from "cluster";

import { build } from "./app.js";
import eventStreamService from "./services/event-stream.service.js";

const app = build();

/**
 * Doing forking to handle workers in separate thread.
 * Better to use a worker_thread/cluster or a separate service for this
 */
if (cluster.isPrimary) {
  try {
    await app.listen({
      host: process.env.HOST ?? "0.0.0.0",
      port: +(process.env.PORT ?? 3000),
    });
    cluster.fork();

    cluster.on("exit", (worker, code, signal) => {
      app.log.error(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      app.log.info("Starting a new worker");
      cluster.fork();
    });
  } catch (err) {
    app.log.error(err);
    throw err;
  }
} else {
  await eventStreamService.consumeEvents(app.log.child({}, { msgPrefix: "[Event Worker] " }));
}
