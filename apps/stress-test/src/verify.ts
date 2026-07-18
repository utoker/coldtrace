/**
 * Redis PubSub verification: subscribe to temperatureUpdates, trigger one
 * createReading, and assert the subscription receives it.
 *
 * Usage: pnpm run verify
 * Env:  GRAPHQL_HTTP_URL, GRAPHQL_WS_URL (defaults: http://localhost:4000/graphql, ws://localhost:4000/graphql)
 */
import 'dotenv/config';
import { createClient } from 'graphql-ws';
import { WebSocketWithOrigin } from './wsClient.js';

const HTTP_URL = process.env.GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql';
const WS_URL = process.env.GRAPHQL_WS_URL || (process.env.GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql').replace(/^http/, 'ws');

async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: T; errors?: unknown[] };
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  if (!json.data) throw new Error('No data in response');
  return json.data as T;
}

async function main() {
  console.log('Redis PubSub verification');
  console.log('  HTTP:', HTTP_URL);
  console.log('  WS: ', WS_URL);

  // 1) Fetch device IDs
  const { getDevices } = await gqlFetch<{ getDevices: { id: string }[] }>(`
    query { getDevices(limit: 5) { id } }
  `);
  const ids = getDevices?.map((d) => d.id).filter(Boolean) || [];
  if (ids.length === 0) {
    console.error('No devices found. Run: pnpm db:setup and seed the database.');
    process.exit(1);
  }
  const deviceId = ids[0];
  console.log('  Using device:', deviceId);

  // 2) Subscribe and wait for one message
  let received = false;
  const client = createClient({
    url: WS_URL,
    webSocketImpl: WebSocketWithOrigin,
  });

  const unsubscribe = client.subscribe(
    {
      query: 'subscription { temperatureUpdates { id temperature deviceId } }',
    },
    {
      next: () => { received = true; },
      error: (e) => console.error('Subscription error:', e),
      complete: () => {},
    }
  );

  // 3) After a short delay, create one reading
  await new Promise((r) => setTimeout(r, 800));
  await gqlFetch(
    `mutation CreateReading($input: CreateReadingInput!) {
      createReading(input: $input) { id }
    }`,
    {
      input: { deviceId, temperature: 5.0, battery: 80 },
    }
  );

  // 4) Wait for the subscription to receive it (or timeout)
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (received) break;
  }

  unsubscribe();
  client.dispose();

  if (received) {
    console.log('\n  Result: Redis PubSub is working.');
    process.exit(0);
  } else {
    console.error('\n  Result: No subscription message received. Redis PubSub may not be connected.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
