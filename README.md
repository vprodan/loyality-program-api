# Loyality Program API

[Case Description](case-description.md)

A TypeScript-based Express.js application with Drizzle ORM and PrstgreSQL database integration.

## Architecture Overview

This implementation leverages a two-thread model:

- **API Thread:** Runs the main Express server handling HTTP requests.
- **Webhook Consumer Thread:** Runs as a separate worker (via cluster/worker threads) to process webhook events using Redis Streams.
- **PostgreSQL Database:**  
  The application uses PostgreSQL as its primary persistent data storage. Database interactions are handled using the Drizzle ORM, which facilitates type-safe queries and migrations. This robust relational database system ensures data integrity and provides advanced querying capabilities for handling complex relationships.

- **Redis:**  
  Redis is employed for its high-performance key-value storage capabilities. In this architecture, Redis is used primarily for:
  - **Caching:** Speeding up data retrieval by caching frequently accessed data.
  - **Message Streaming:** Serving as the backbone for the webhook consumer thread. Redis Streams allow efficient, ordered, and scalable processing of webhook events, ensuring the API thread operates independently of background processing.

## Prerequisites

- Node.js ≥ 22.14.0
- pnpm (you can use your favorite package manager)
- PostgreSQL
- Redis

## Installation

```bash
pnpm install
```

## Environment Setup

Copy `.env.example` to `.env` file in the root directory:

```bash
cp .env.example .env
```

Example:

```
NODE_ENV=dev
LOG_LEVEL=debug
PORT=3000

DB_HOST=db
DB_PORT=5432
DB_NAME=app
DB_USER=app
DB_PASSWORD=randompassword

REDIS_HOST=redis
REDIS_PORT=6379
```

## Database Setup

```bash
pnpm drizzle-kit migrate
```

## Tests [WIP]

```bash
# Run tests
npm test
```

## Docker

Run with Docker Compose:

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

The application will be available at `http://localhost:3000`.

Services:

- API (Node.js)
- PostgreSQL Database
- Redis

## Benchmark

To run benchmark you need to setup previous step.

```bash
# export DELAY=500ms # Fine-tune delay
# export CONCURRENCY=10 # Fine-tune concurrency
./run-benchmark.sh
```

## Tech Stack

- TypeScript - Programming language
- Express.js - Web framework
- Drizzle ORM - Database ORM
- PostgreSQL - Database
- Redis - Key-value storage

## License

MIT © Vadym Prodan
