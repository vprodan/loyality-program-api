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
NODE_ENV=dev # Use `dev` to enable swagger docs
LOG_LEVEL=debug
PORT=3000

DB_HOST=localhost # or `db` for docker
DB_PORT=5432
DB_NAME=app
DB_USER=app
DB_PASSWORD=randompassword

REDIS_HOST=localhost # or `redis` for docker
REDIS_PORT=6379
```

## Database Setup

```bash
pnpm drizzle-kit migrate
```

## Run

```bash
# Run in watch mode
pnpm dev

# Build and run
pnpm start
```

## Build

```bash
# Build, will produce *.js into /dist
pnpm build
```

## Tests

```bash
# Run tests
pnpm test

# Run tests with coverage report
pnpm test --coverage

# Run tests with watch mode
pnpm test:dev

# Run tests with watch mode and nice web UI
pnpm test:dev --ui
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
The Swagger/OpenAPI documentation will be available at `http://localhost:3000/documentation`.

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

- **TypeScript** - Strongly typed programming language that builds on JavaScript, giving you better tooling at any scale
- **Fastify** - Fast and low overhead web framework
- **Drizzle ORM** - Headless TypeScript ORM with a head. 🐲
- **PostgreSQL** - Powerful, open source object-relational database system
- **Redis** - Open-source, in-memory data structure store
- **Vitest** - Next Generation Testing Framework

## License

[MIT © Vadym Prodan](LICENSE)
