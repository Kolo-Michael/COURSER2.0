/**
 * Express app construction — mirrors backend/app/main.py.
 *
 * Exported separately from the boot code so tests (and any embedder) can
 * import the app without triggering a listen() call.
 *
 * Mounts every router under `/api` (so the SPA and API share one origin and
 * auth cookies work with SameSite=Lax), applies security headers, CORS,
 * cookie parsing, and the global rate limit, then exposes `/`, `/health`,
 * and the 0-byte `/ping` keepalive endpoint.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Request, Response } from "express";

import { errorMiddleware } from "./errors.js";
import { allowedOrigins, securityHeaders } from "./headers.js";
import { globalLimiter } from "./rateLimit.js";
import { router as authRouter } from "./routes/auth.js";
import { router as coursesRouter } from "./routes/courses.js";
import { router as lessonsRouter } from "./routes/lessons.js";
import { router as newsletterRouter } from "./routes/newsletter.js";
import { router as quizzesRouter } from "./routes/quizzes.js";
import { router as streakRouter } from "./routes/streak.js";

// The API app mirrors `api_app` in the Python main.py.
const apiApp = express();
apiApp.disable("x-powered-by");
apiApp.use(securityHeaders);
apiApp.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);
apiApp.use(express.json());
apiApp.use(cookieParser());
apiApp.use(globalLimiter);

apiApp.use("/auth", authRouter);
apiApp.use("/courses", coursesRouter);
apiApp.use("/lessons", lessonsRouter);
apiApp.use("/modules", quizzesRouter);
apiApp.use("/newsletter", newsletterRouter);
apiApp.use("/streak", streakRouter);

apiApp.get("/", (_req: Request, res: Response) => {
  res.json({ message: "COURSER API" });
});

apiApp.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

apiApp.get("/ping", (_req: Request, res: Response) => {
  res.status(200).end();
});

apiApp.use(errorMiddleware);

// The gateway app mounts the API under /api — same shape as the Python app.
const app = express();
app.disable("x-powered-by");
app.use(securityHeaders);
app.use("/api", apiApp);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "COURSER API", docs: "/api/docs", health: "/api/health" });
});

export { apiApp };
export default app;