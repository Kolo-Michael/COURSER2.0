/**
 * Auth endpoints — mirrors backend/app/api/auth.py.
 *
 * Tokens are set as HttpOnly+SameSite cookies (the JSON body is informational);
 * the non-HttpOnly `courser_session` cookie lets the SPA know who is signed in.
 */
import { Router } from "express";
import { z } from "zod";

import { config, isDev } from "../config.js";
import { badRequest, forbidden, notFound, unauthorized, wrap } from "../errors.js";
import { requireUser } from "../middleware/auth.js";
import {
  adminLimiter,
  forgotLimiter,
  loginLimiter,
  refreshLimiter,
  resetLimiter,
  signupLimiter,
  verifyLimiter,
} from "../rateLimit.js";
import { hashPassword, verifyPassword } from "../security.js";
import { normalizeDt } from "../serialize.js";
import * as authService from "../services/authService.js";
import type { UserRow } from "../services/authService.js";
import { normalizeEmail, validate } from "../validate.js";

export const router = Router();

// --- schemas (mirror backend/app/schemas/auth.py) -------------------------

const emailSchema = z.string().email();

const UserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: emailSchema,
  full_name: z.string().max(100).nullish(),
  role: z.enum(["student", "admin", "super_admin"]).default("student"),
  password: z.string().min(8).max(128),
});

const AdminCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: emailSchema,
  password: z.string().min(8).max(128),
  full_name: z.string().max(100).nullish(),
  role: z.enum(["admin", "super_admin"]).default("admin"),
});

const ProfileUpdateSchema = z.object({
  full_name: z.string().max(100).nullish(),
  avatar_url: z.string().max(20000).nullish(),
  nav_style: z.enum(["sidebar", "floating"]).nullish(),
  nav_collapsed: z.boolean().nullish(),
});

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1).max(128),
  new_password: z.string().min(8).max(128),
});

const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  remember_me: z.boolean().default(false),
});

const ForgotSchema = z.object({ email: emailSchema });
const VerifyCodeSchema = z.object({ email: emailSchema, code: z.string().length(6) });
const ResetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().length(6),
  new_password: z.string().min(8).max(128),
});
const RefreshSchema = z.object({ refresh_token: z.string().nullish() });

// --- serializers ----------------------------------------------------------

function userJson(user: UserRow): Record<string, unknown> {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    is_verified: user.is_verified,
    avatar_url: user.avatar_url,
    nav_style: user.nav_style || "sidebar",
    nav_collapsed: Boolean(user.nav_collapsed),
    created_at: normalizeDt(user.created_at),
    updated_at: normalizeDt(user.updated_at),
    last_login: normalizeDt(user.last_login),
  };
}

// --- cookie helpers -------------------------------------------------------

function cookieSecure(): boolean {
  return !isDev();
}

function cookieSameSite(): "lax" | "none" {
  return cookieSecure() ? "none" : "lax";
}

function setAuthCookies(
  res: { cookie: (k: string, v: string, o: Record<string, unknown>) => void },
  access: string,
  refresh: string,
  rememberMe = false
): void {
  const secure = cookieSecure();
  // Express `maxAge` is in milliseconds; Python's max_age was seconds.
  const refreshMaxAgeMs =
    (rememberMe ? config.REMEMBER_ME_EXPIRE_DAYS : config.REFRESH_TOKEN_EXPIRE_DAYS) *
    86_400 *
    1000;
  res.cookie("access_token", access, {
    httpOnly: true,
    secure,
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: config.ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000,
  });
  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    secure,
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: refreshMaxAgeMs,
  });
}

function clearAuthCookies(res: {
  clearCookie: (k: string, o: Record<string, unknown>) => void;
}): void {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("courser_session", { path: "/" });
}

function setSessionCookie(
  res: { cookie: (k: string, v: string, o: Record<string, unknown>) => void },
  user: UserRow
): void {
  const payload = {
    identifier: user.full_name || user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    id: user.id,
    avatarUrl: user.avatar_url,
    navStyle: user.nav_style || "sidebar",
    navCollapsed: Boolean(user.nav_collapsed),
  };
  res.cookie("courser_session", encodeURIComponent(JSON.stringify(payload)), {
    httpOnly: false,
    secure: cookieSecure(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: config.ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000,
  });
}

function tokenResponse(user: UserRow, access: string, refresh: string, sessionExpiresAt: Date) {
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "bearer",
    user: userJson(user),
    session_expires_at: sessionExpiresAt.toISOString(),
  };
}

// --- endpoints ------------------------------------------------------------

router.post(
  "/register",
  wrap(async (req, res) => {
    const data = validate(UserCreateSchema, req.body);
    const email = normalizeEmail(data.email);
    const existing = await authService.getUserByEmail(email);
    if (existing) {
      throw badRequest("We couldn't create your account with those details.");
    }
    const user = await authService.createUser(data.username, email, data.password, {
      fullName: data.full_name ?? null,
      role: data.role,
    });
    res.status(201).json(userJson(user));
  })
);

router.post(
  "/signup",
  signupLimiter,
  wrap(async (req, res) => {
    const data = validate(UserCreateSchema, req.body);
    const email = normalizeEmail(data.email);
    const existing = await authService.getUserByEmail(email);
    if (existing) {
      throw badRequest("We couldn't create your account with those details.");
    }
    const user = await authService.createUser(data.username, email, data.password, {
      fullName: data.full_name ?? null,
      role: data.role,
    });
    const tokens = await authService.issueTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    setSessionCookie(res, user);
    res.status(201).json(tokenResponse(user, tokens.accessToken, tokens.refreshToken, tokens.sessionExpiresAt));
  })
);

router.post(
  "/login",
  loginLimiter,
  wrap(async (req, res) => {
    const data = validate(LoginSchema, req.body);
    const email = normalizeEmail(data.email);
    const user = await authService.authenticateUser(email, data.password);
    if (!user) {
      throw unauthorized("Invalid email or password.");
    }
    const tokens = await authService.issueTokens(user, data.remember_me);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, data.remember_me);
    setSessionCookie(res, user);
    res.json(tokenResponse(user, tokens.accessToken, tokens.refreshToken, tokens.sessionExpiresAt));
  })
);

router.post(
  "/refresh",
  refreshLimiter,
  wrap(async (req, res) => {
    const cookieToken = (req.cookies?.refresh_token as string | undefined) ?? null;
    let bodyToken: string | null = null;
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length) {
      bodyToken = validate(RefreshSchema, req.body).refresh_token ?? null;
    }
    const refresh = cookieToken || bodyToken;
    if (!refresh) throw unauthorized("No refresh token.");

    const rotated = await authService.rotateRefreshToken(refresh);
    if (!rotated) {
      clearAuthCookies(res);
      throw unauthorized("Refresh token rejected.");
    }
    const remainingMs = rotated.sessionExpiresAt.getTime() - Date.now();
    const remainingDays = Math.floor(remainingMs / 86_400_000);
    const rememberMe = remainingDays > config.REFRESH_TOKEN_EXPIRE_DAYS;
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken, rememberMe);
    setSessionCookie(res, rotated.user);
    res.json(
      tokenResponse(rotated.user, rotated.accessToken, rotated.refreshToken, rotated.sessionExpiresAt)
    );
  })
);

router.post(
  "/logout",
  wrap(async (req, res) => {
    const cookieToken = (req.cookies?.refresh_token as string | undefined) ?? null;
    if (cookieToken) await authService.revokeSession(cookieToken);
    clearAuthCookies(res);
    res.status(204).end();
  })
);

router.get(
  "/me",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as unknown as { userId: string }).userId;
    const user = await authService.getUserById(userId);
    if (!user) throw notFound("User not found");
    res.json(userJson(user));
  })
);

router.patch(
  "/me",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as unknown as { userId: string }).userId;
    const data = validate(ProfileUpdateSchema, req.body);
    const user = await authService.getUserById(userId);
    if (!user) throw notFound("User not found");

    const sets: string[] = [];
    const params: unknown[] = [userId];
    let i = 2;
    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        sets.push(`${field} = $${i++}`);
        params.push(value);
      }
    }
    if (sets.length) {
      await db.query(`UPDATE users SET ${sets.join(", ")} WHERE id = $1`, params);
    }
    const updated = await authService.getUserById(userId);
    if (!updated) throw notFound("User not found");
    setSessionCookie(res, updated);
    res.json(userJson(updated));
  })
);

// Imported lazily to avoid a cycle at module scope.
import { db } from "../db.js";

router.post(
  "/change-password",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as unknown as { userId: string }).userId;
    const data = validate(ChangePasswordSchema, req.body);
    const user = await authService.getUserById(userId);
    if (!user) throw notFound("User not found");
    if (!verifyPassword(data.current_password, user.hashed_password)) {
      throw badRequest("Current password is incorrect.");
    }
    await db.query(
      `UPDATE users SET hashed_password = $2, failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
      [userId, hashPassword(data.new_password)]
    );
    res.json({ message: "Password updated successfully." });
  })
);

router.post(
  "/admin",
  adminLimiter,
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as unknown as { userId: string }).userId;
    const data = validate(AdminCreateSchema, req.body);
    const caller = await authService.getUserById(userId);
    if (!caller || caller.role !== "super_admin") {
      throw forbidden("Insufficient permissions");
    }
    const email = normalizeEmail(data.email);
    const existing = await authService.getUserByEmail(email);
    if (existing) {
      throw badRequest("We couldn't create this admin account with those details.");
    }
    const newUser = await authService.createUser(data.username, email, data.password, {
      fullName: data.full_name ?? null,
      role: data.role,
      createdBy: caller.id,
    });
    res.status(201).json(userJson(newUser));
  })
);

router.post(
  "/forgot-password",
  forgotLimiter,
  wrap(async (req, res) => {
    const data = validate(ForgotSchema, req.body);
    await authService.requestPasswordReset(normalizeEmail(data.email));
    res.json({
      message: "If an account exists for that email, a reset code has been sent.",
    });
  })
);

router.post(
  "/verify-code",
  verifyLimiter,
  wrap(async (req, res) => {
    const data = validate(VerifyCodeSchema, req.body);
    const [ok, message] = await authService.verifyResetCode(
      normalizeEmail(data.email),
      data.code
    );
    if (!ok) throw badRequest(message);
    res.json({ message, valid: true });
  })
);

router.post(
  "/reset-password",
  resetLimiter,
  wrap(async (req, res) => {
    const data = validate(ResetPasswordSchema, req.body);
    const [ok, message] = await authService.resetPassword(
      normalizeEmail(data.email),
      data.code,
      data.new_password
    );
    if (!ok) throw badRequest(message);
    res.json({ message });
  })
);