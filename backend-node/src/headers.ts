/**
 * Security headers + CORS middleware — mirrors backend/app/main.py.
 *
 * Stamps a fixed set of browser defense headers on every response and
 * configures CORS with explicit origins (cookies require no `*`).
 */
import type { NextFunction, Request, Response } from "express";

import { config } from "./config.js";

function buildCspHeader(): string {
  const frontendOrigins = config.FRONTEND_ORIGINS;
  const apiOrigin = config.API_ORIGIN;
  const connect = [
    "'self'",
    apiOrigin,
    ...frontendOrigins.split(",").map((o) => o.trim()).filter(Boolean),
  ].join(" ");
  return (
    "default-src 'self'; " +
    "img-src 'self' data:; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "font-src 'self' data: https://cdnjs.cloudflare.com; " +
    `connect-src ${connect}; ` +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
}

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": buildCspHeader(),
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
};

/** Stamp security headers on every response (only if not already set). */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!res.getHeader(name)) res.setHeader(name, value);
  }
  next();
}

function buildAllowedOrigins(): string[] {
  const origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
  ];
  const extra = config.FRONTEND_ORIGINS;
  if (extra) origins.push(...extra.split(",").map((o) => o.trim()).filter(Boolean));
  if (config.FRONTEND_ORIGIN) origins.push(config.FRONTEND_ORIGIN);
  origins.push(
    "https://courser2.vercel.app",
    "https://courser-frontend.vercel.app",
    "https://courser-api-18uo.onrender.com"
  );
  return origins;
}

export const allowedOrigins = buildAllowedOrigins();

/**
 * CORS origin callback — allows any origin in the explicit allowlist plus any
 * `*.vercel.app` deployment (production and per-deployment preview URLs, whose
 * hostnames change on every push). All of the project's frontends are hosted
 * on Vercel, so the wildcard keeps previews working without hardcoding hashes.
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}