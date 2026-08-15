/**
 * Password hashing, JWT issue/decode, and auth helpers.
 *
 * Mirrors backend/app/core/security.py. bcryptjs is used for bcrypt hashing
 * (it verifies the $2b$ prefix passlib produces, so existing hashes in Neon
 * keep working); jsonwebtoken signs HS256 JWTs with the same claims shape
 * (`sub`, `role`, `iat`, `exp`, `type`, `jti`).
 */
import { randomUUID } from "node:crypto";
import type { Request } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { config } from "./config.js";
import { unauthorized } from "./errors.js";

export function hashPassword(plain: string): string {
  // bcryptjs mints $2a$ salts; it still verifies $2b$ hashes that passlib
  // produced, so existing users' stored hashes keep working.
  const salt = bcrypt.genSaltSync(config.BCRYPT_ROUNDS);
  return bcrypt.hashSync(plain, salt);
}

export function verifyPassword(plain: string, hashed: string): boolean {
  try {
    return bcrypt.compareSync(plain, hashed);
  } catch {
    return false;
  }
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function createAccessToken(userId: string, role: string): string {
  const now = nowSeconds();
  return jwt.sign(
    {
      sub: String(userId),
      role,
      iat: now,
      exp: now + config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
      type: "access",
      jti: randomUUID(),
    },
    config.SECRET_KEY,
    { algorithm: config.ALGORITHM }
  );
}

export function createRefreshToken(
  userId: string,
  role: string,
  expireDays?: number
): string {
  const days = expireDays ?? config.REFRESH_TOKEN_EXPIRE_DAYS;
  const now = nowSeconds();
  return jwt.sign(
    {
      sub: String(userId),
      role,
      iat: now,
      exp: now + days * 24 * 60 * 60,
      type: "refresh",
      jti: randomUUID(),
    },
    config.SECRET_KEY,
    { algorithm: config.ALGORITHM }
  );
}

export interface TokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  type: string;
  jti: string;
}

export function decodeToken(token: string, expectedType: string): TokenPayload {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.SECRET_KEY, {
      algorithms: [config.ALGORITHM],
    }) as jwt.JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw unauthorized("Token expired");
    }
    throw unauthorized("Invalid token");
  }
  if (payload.type !== expectedType) {
    throw unauthorized("Wrong token type");
  }
  return payload as unknown as TokenPayload;
}

/** Read the access token from Authorization: Bearer or the HttpOnly cookie. */
export function getAccessToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (token) return token;
  }
  return (req.cookies?.access_token as string | undefined) ?? null;
}

/** Read the refresh token from its HttpOnly cookie. */
export function getRefreshToken(req: Request): string | null {
  return (req.cookies?.refresh_token as string | undefined) ?? null;
}

/** Resolve the authenticated user's UUID or throw 401 (matches FastAPI dep). */
export function getCurrentUserId(req: Request): string {
  const token = getAccessToken(req);
  if (!token) throw unauthorized("Not authenticated");
  const payload = decodeToken(token, "access");
  const sub = payload.sub;
  if (!sub) throw unauthorized("Token has no subject");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub)) {
    throw unauthorized("Token subject is not a UUID");
  }
  return sub;
}