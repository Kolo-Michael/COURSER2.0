/**
 * Keepalive pinger — Node port of backend/keepalive.py.
 *
 * Pings the health endpoint to keep serverless/free instances warm.
 *
 * Usage:
 *   npm run keepalive [URL]
 *   npm run keepalive -- --loop [URL]          # every 15s, forever
 *   npm run keepalive -- --loop --interval 5   # custom interval
 *
 * URL resolution: CLI arg → $HEALTH_URL → default.
 * Exit code 0 = HTTP 200, 1 = failure.
 */

const DEFAULT_URL = "https://courser-api-18uo.onrender.com/api/health";
const TIMEOUT_SECONDS = 30;

async function ping(url: string): Promise<number> {
  console.log(`Pinging ${url}`);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_SECONDS * 1000) });
    const body = (await res.text()).slice(0, 200).trim();
    if (!res.ok) {
      console.log(`FAILED: HTTP ${res.status} ${body}`);
      return 1;
    }
    console.log(`OK: HTTP ${res.status} ${body}`);
    return 0;
  } catch (err) {
    console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
    return 1;
  }
}

const args = process.argv.slice(2);
const loop = args.includes("--loop");
const intervalArg = args.findIndex((a) => a === "--interval");
const interval = intervalArg >= 0 && args[intervalArg + 1] ? parseInt(args[intervalArg + 1], 10) : 15;
const positional = args.filter((a) => !a.startsWith("--"));
const url = positional[0] ?? process.env.HEALTH_URL ?? DEFAULT_URL;

if (loop) {
  console.log(`Loop mode: pinging ${url} every ${interval}s`);
  setInterval(() => {
    void ping(url);
  }, interval * 1000);
} else {
  const code = await ping(url);
  process.exit(code);
}