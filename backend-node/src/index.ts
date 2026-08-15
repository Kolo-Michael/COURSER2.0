/**
 * Boot entrypoint — starts the HTTP server on $PORT.
 *
 * The express app itself lives in `./app.ts` (exported for tests); this file
 * only checks the database connectivity and calls listen().
 */
import app from "./app.js";
import { config } from "./config.js";
import { pingDatabase } from "./db.js";

const PORT = parseInt(process.env.PORT || "8000", 10);

async function main(): Promise<void> {
  const dbOk = await pingDatabase();
  if (!dbOk && config.APP_ENV === "production") {
    console.warn("WARNING: database unreachable at boot — fallback catalog will be served.");
  }
  app.listen(PORT, () => {
    console.log(
      `COURSER Node API listening on http://127.0.0.1:${PORT} (db ${dbOk ? "ok" : "unreachable"})`
    );
  });
}

main().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});