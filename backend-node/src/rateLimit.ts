/**
 * In-memory rate limiters — mirrors backend/app/api/auth.py.
 *
 * The Python side uses a global slowapi 200/minute limit plus per-route
 * sliding-window limiters on auth endpoints. Here `express-rate-limit`
 * provides both: a global limiter on the whole API and tighter per-route
 * limiters keyed by client IP. Retry-After is set automatically.
 */
import rateLimit from "express-rate-limit";

const msg = (retrySeconds: number) => ({
  detail: `Too many requests. Retry in ${retrySeconds}s.`,
});

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(60),
});

export const signupLimiter = rateLimit({
  windowMs: 3_600_000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(3600),
});

export const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(60),
});

export const refreshLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(60),
});

export const adminLimiter = rateLimit({
  windowMs: 3_600_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(3600),
});

export const forgotLimiter = rateLimit({
  windowMs: 3_600_000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(3600),
});

export const verifyLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(60),
});

export const resetLimiter = rateLimit({
  windowMs: 3_600_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg(3600),
});