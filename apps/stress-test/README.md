# ColdTrace Stress Test

Verify Redis PubSub and measure real-time update throughput for resume metrics.

## Prerequisites

- Backend running (local or Railway) with Redis
- Database seeded with at least one device: `pnpm db:setup` (includes seed)

## Quick start (local)

```bash
pnpm docker:up          # Postgres + Redis
pnpm db:setup           # Migrate + seed
pnpm --filter @coldtrace/backend dev   # Backend (in one terminal)
pnpm stress:verify      # In another terminal
```

## 1. Verify Redis PubSub

Confirms subscriptions receive updates after `createReading`:

```bash
# Local
pnpm stress:verify

# Production (Railway)
GRAPHQL_HTTP_URL=https://YOUR-BACKEND.up.railway.app/graphql pnpm stress:verify
```

If `GRAPHQL_WS_URL` is not set, it is derived from `GRAPHQL_HTTP_URL` (http→ws, https→wss).  
For production, the backend requires an `Origin` header on WebSocket connections. The stress-test sends `Origin: https://coldtrace.app` by default. If your backend's `ALLOWED_ORIGINS` does not include that, set `GRAPHQL_WS_ORIGIN` to an allowed origin (e.g. your Vercel frontend URL).

## 2. Stress Test (Publisher + Subscriber)

**Terminal 1 – Subscribers (start first):**

```bash
# Local, 60s, 20 clients
pnpm stress:subscriber

# Production, 60s, 30 clients
DURATION_SECONDS=60 NUM_SUBSCRIBERS=30 \
  GRAPHQL_HTTP_URL=https://YOUR-BACKEND.up.railway.app/graphql \
  pnpm stress:subscriber
```

**Terminal 2 – Publisher:**

```bash
# Local, 30s, 50 concurrent
pnpm stress:publisher

# Production, 30s, 80 concurrent
DURATION_SECONDS=30 CONCURRENT=80 \
  GRAPHQL_HTTP_URL=https://YOUR-BACKEND.up.railway.app/graphql \
  pnpm stress:publisher
```

### Env

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAPHQL_HTTP_URL` | `http://localhost:4000/graphql` | GraphQL HTTP endpoint |
| `GRAPHQL_WS_URL` | derived from `GRAPHQL_HTTP_URL` | GraphQL WebSocket endpoint |
| `GRAPHQL_WS_ORIGIN` | `https://coldtrace.app` | Origin header for WebSocket (must be in backend ALLOWED_ORIGINS in production) |
| `DURATION_SECONDS` | 30 (publisher), 60 (subscriber) | Test length |
| `CONCURRENT` | 50 | Concurrent `createReading` workers (publisher) |
| `NUM_SUBSCRIBERS` | 20 | Subscription clients (subscriber) |

## 3. Resume Bullet and How to Back It Up

### Suggested wording

- **Strong (if you hit the numbers):**  
  *"Architected a real-time IoT dashboard handling **X,000+** sensor updates/sec via GraphQL subscriptions and Redis PubSub, with sub-100ms p95 latency."*

- **Conservative:**  
  *"Architected a real-time IoT dashboard with GraphQL subscriptions and Redis PubSub, supporting **50+** concurrent subscription clients and **X,000** createReading/sec throughput."*

Use the **publisher’s “Throughput: X createReading/sec”** as the main “updates/sec” number.  
Use **subscriber’s “Messages/sec”** as “subscription delivery” (messages delivered to all clients).

### How to back it up

1. **Screenshot or log** of `pnpm stress:publisher` and `pnpm stress:subscriber` with:
   - Throughput (createReading/sec)
   - Latency (avg, p95)
   - Messages/sec and number of subscribers
2. **One-line note** in a `docs/` or `stress-test/` file, e.g.:
   - *"Stress test on [date]: createReading throughput X/sec, N subscribers, Y messages/sec. Backend: Railway, Redis PubSub."*
3. In interviews: describe the flow (createReading → Redis PubSub → WebSocket subscribers) and that you ran the included stress-test scripts to get the numbers.

### Interpreting results

- **Publisher throughput** = `createReading` mutations per second (backend + DB + Redis publish).
- **Subscriber messages/sec** = `createReading/sec × NUM_SUBSCRIBERS` (each createReading is pushed to every subscriber).
- For a “10,000+ updates/sec” style claim, use **publisher throughput**; “updates” = new readings. If you have 50 subscribers and 200 createReading/sec, you can also say “10,000 subscription messages/sec” (200×50).

Run against **production (Railway)** for the most realistic numbers; local runs can be higher (no network, shared machine).
