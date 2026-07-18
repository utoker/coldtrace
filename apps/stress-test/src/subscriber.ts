/**
 * Stress test: N clients subscribe to temperatureUpdates and count messages.
 * Run publisher in another terminal to generate traffic.
 *
 * Usage: pnpm run subscriber
 * Env:  GRAPHQL_WS_URL, DURATION_SECONDS (default 60), NUM_SUBSCRIBERS (default 20)
 */
import 'dotenv/config';
import { createClient } from 'graphql-ws';
import { WebSocketWithOrigin } from './wsClient.js';

const WS_URL = process.env.GRAPHQL_WS_URL || (process.env.GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql').replace(/^http/, 'ws');
const DURATION_SEC = parseInt(process.env.DURATION_SECONDS || '60', 10);
const NUM_SUBSCRIBERS = parseInt(process.env.NUM_SUBSCRIBERS || '20', 10);

async function main() {
  console.log('Subscriber stress test');
  console.log('  WS:       ', WS_URL);
  console.log('  Duration: ', DURATION_SEC, 's');
  console.log('  Subscribers:', NUM_SUBSCRIBERS);
  console.log('  (Run publisher in another terminal to generate traffic.)\n');

  const counts: number[] = Array(NUM_SUBSCRIBERS).fill(0);
  const clients: { unsubscribe: () => void; dispose: () => void }[] = [];

  for (let i = 0; i < NUM_SUBSCRIBERS; i++) {
    const idx = i;
    const client = createClient({
      url: WS_URL,
      webSocketImpl: WebSocketWithOrigin,
    });
    const unsubscribe = client.subscribe(
      {
        query: 'subscription { temperatureUpdates { id temperature deviceId } }',
      },
      {
        next: () => { counts[idx] = (counts[idx] ?? 0) + 1; },
        error: (e) => console.error('Subscriber', idx, 'error:', e),
        complete: () => {},
      }
    );
    clients.push({ unsubscribe, dispose: () => client.dispose() });
  }

  await new Promise((r) => setTimeout(r, DURATION_SEC * 1000));

  for (const c of clients) {
    c.unsubscribe();
    c.dispose();
  }

  const total = counts.reduce((a, b) => a + b, 0);
  const perSec = total / DURATION_SEC;
  const avgPerSub = total / NUM_SUBSCRIBERS;

  console.log('--- Subscriber results ---');
  console.log('  Total messages: ', total);
  console.log('  Messages/sec:   ', perSec.toFixed(2));
  console.log('  Avg per client: ', avgPerSub.toFixed(2));
  console.log('\nResume-ready: "subscription delivery: ' + Math.round(perSec) + ' messages/sec across ' + NUM_SUBSCRIBERS + ' clients"');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
