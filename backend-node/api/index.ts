/**
 * Vercel serverless entry — exports the Express app as the function default.
 *
 * The whole API lives in one function: Vercel maps `/api` and everything under
 * it to this handler, and Express (which mounts all routers under `/api`)
 * serves the request with the original path intact. The separate boot file
 * (`src/index.ts`) is only used for local/container `npm start`.
 */
import app from "../src/app.js";

export default app;