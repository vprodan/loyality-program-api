# Loyalty points API Case

A TypeScript-based Express.js application with Drizzle ORM and PrstgreSQL database integration.

## Prerequisites

- Node.js >= 22.14.0
- pnpm (you can use your favorite package manager)

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

## Scripts

```bash
# Run development server
npm run dev

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
- LibSQL - Database

## License

MIT © Vadym Prodan
