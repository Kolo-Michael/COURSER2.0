/**
 * HTTP error type + FastAPI-shaped error response helpers.
 *
 * FastAPI returns `{ "detail": <string|list> }` for HTTPException and 422
 * validation failures. Every route that needs to raise uses `HttpError` so
 * the centralized error middleware can render that exact shape, and the
 * optional `headers` (e.g. Retry-After for 429) are stamped on the response.
 */
import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  detail: unknown;
  headers?: Record<string, string>;

  constructor(status: number, detail: unknown, headers?: Record<string, string>) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.status = status;
    this.detail = detail;
    this.headers = headers;
  }
}

export const badRequest = (detail: string): HttpError => new HttpError(400, detail);
export const unauthorized = (detail: string): HttpError => new HttpError(401, detail);
export const forbidden = (detail: string): HttpError => new HttpError(403, detail);
export const notFound = (detail: string): HttpError => new HttpError(404, detail);
export const tooManyRequests = (detail: string, retryAfter: number): HttpError =>
  new HttpError(429, detail, { "Retry-After": String(retryAfter) });

/** Wrap an async route handler so rejections reach the error middleware. */
export function wrap(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Central error handler — renders `{ detail }` for HttpError, else 500. */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    for (const [k, v] of Object.entries(err.headers || {})) res.setHeader(k, v);
    res.status(err.status).json({ detail: err.detail });
    return;
  }
  // Malformed JSON body — body-parser throws entity.parse.failed. FastAPI
  // answers 422, so match that instead of leaking a 500.
  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  ) {
    res.status(422).json({ detail: "There was an error parsing the body" });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ detail: "Internal server error" });
}