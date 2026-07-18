/**
 * Stress test: publish createReading mutations as fast as possible.
 * Reports: throughput (createReading/sec), latency (avg, p95).
 *
 * Usage: pnpm run publisher
 * Env:  GRAPHQL_HTTP_URL, DURATION_SECONDS (default 30), CONCURRENT (default 50)
 */
import 'dotenv/config';

const HTTP_URL = process.env.GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql';
const DURATION_SEC = parseInt(process.env.DURATION_SECONDS || '30', 10);
const CONCURRENT = parseInt(process.env.CONCURRENT || '50', 10);

async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: unknown[] };
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  return (json.data ?? {}) as T;
}

async function main() {
  console.log('Publisher stress test');
  console.log('  HTTP:    ', HTTP_URL);
  console.log('  Duration:', DURATION_SEC, 's');
  console.log('  Concurrency:', CONCURRENT);

  const { getDevices } = await gqlFetch<{ getDevices: { id: string }[] }>(`
    query { getDevices(limit: 200) { id } }
  `);
  const deviceIds = (getDevices ?? []).map((d) => d.id).filter(Boolean);
  if (deviceIds.length === 0) {
    console.error('No devices. Run: pnpm db:setup and seed.');
    process.exit(1);
  }
  console.log('  Devices: ', deviceIds.length);

  const stats = { total: 0, success: 0, fail: 0, latencies: [] as number[] };
  const endAt = Date.now() + DURATION_SEC * 1000;

  async function runWorker() {
    while (Date.now() < endAt) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const input = {
        deviceId,
        temperature: 2 + Math.random() * 6,
        battery: 50 + Math.random() * 50,
      };
      const start = performance.now();
      stats.total++;
      try {
        await gqlFetch(
          `mutation CreateReading($input: CreateReadingInput!) {
            createReading(input: $input) { id }
          }`,
          { input }
        );
        stats.success++;
        stats.latencies.push(performance.now() - start);
      } catch {
        stats.fail++;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENT }, () => runWorker());
  await Promise.all(workers);

  const elapsed = DURATION_SEC;
  const throughput = stats.success / elapsed;
  const sorted = stats.latencies.slice().sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;

  console.log('\n--- Publisher results ---');
  console.log('  Total:     ', stats.total);
  console.log('  Success:   ', stats.success);
  console.log('  Failed:    ', stats.fail);
  console.log('  Throughput:', throughput.toFixed(2), 'createReading/sec');
  console.log('  Latency avg:', avg.toFixed(2), 'ms');
  console.log('  Latency p95:', p95.toFixed(2), 'ms');
  console.log('\nResume-ready: "createReading throughput: ' + Math.round(throughput) + '/sec"');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
