/**
 * Auth endpoints — mirrors backend/app/api/auth.py.
 *
 * Tokens are set as HttpOnly+SameSite cookies (the JSON body is informational);
 * the non-HttpOnly `courser_session` cookie lets the SPA know who is signed in.
 */
import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { config, isDev } from "../config.js";
import { badRequest, forbidden, notFound, unauthorized, wrap } from "../errors.js";
import { isAllowedOrigin } from "../headers.js";
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
import { normalizeDt, nowIso } from "../serialize.js";
import * as authService from "../services/authService.js";
import type { UserRow } from "../services/authService.js";
import {
  exchangeGoogleCode,
  googleAuthorizeUrl,
  isGoogleConfigured,
  type GoogleProfile,
} from "../services/googleAuth.js";
import { normalizeEmail, validate } from "../validate.js";

export const router = Router();

// --- schemas (mirror backend/app/schemas/auth.py) -------------------------

const emailSchema = z.string().email();

// Shared password policy: 8+ chars, at least one lowercase, one uppercase,
// and one number (per the agreed signup requirements).
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128)
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const UserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: emailSchema,
  full_name: z.string().max(100).nullish(),
  role: z.enum(["student", "admin", "super_admin"]).default("student"),
  password: strongPassword,
});

const AdminCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: emailSchema,
  password: strongPassword,
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
  new_password: strongPassword,
});

// Accepts `identifier` (email or username) for the new combined field, while
// keeping `email` for backward compatibility with the mobile client.
const LoginSchema = z
  .object({
    identifier: z.string().min(1).max(200).optional(),
    email: emailSchema.optional(),
    password: z.string().min(1).max(128),
    remember_me: z.boolean().default(false),
  })
  .refine((v) => Boolean(v.identifier ?? v.email), {
    message: "Either identifier or email is required",
    path: ["identifier"],
  });

const ForgotSchema = z.object({ email: emailSchema });
const VerifyCodeSchema = z.object({ email: emailSchema, code: z.string().length(6) });
const ResetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().length(6),
  new_password: strongPassword,
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
  user: UserRow,
  accessToken?: string
): void {
  const payload: Record<string, unknown> = {
    identifier: user.full_name || user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    id: user.id,
    avatarUrl: user.avatar_url,
    navStyle: user.nav_style || "sidebar",
    navCollapsed: Boolean(user.nav_collapsed),
  };
  // Include the access token so same-origin (or cookie-readable) clients can
  // use it as a Bearer header — critical for cross-origin Safari/iOS where
  // ITP blocks third-party HttpOnly cookies.
  if (accessToken) payload.accessToken = accessToken;
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

// --- Google OAuth helpers ----------------------------------------------------

const GOOGLE_STATE_COOKIE = "google_oauth_state";

/** Cookie holding the CSRF state + the frontend origin to return to. */
function setGoogleStateCookie(
  res: { cookie: (k: string, v: string, o: Record<string, unknown>) => void },
  bundle: { state: string; origin: string }
): void {
  res.cookie(GOOGLE_STATE_COOKIE, encodeURIComponent(JSON.stringify(bundle)), {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: 10 * 60 * 1000,
  });
}

/**
 * Resolve the frontend origin to redirect back to after Google. The SPA sends
 * its own origin; it must be on the CORS allowlist (or a dev localhost). Falls
 * back to the configured production origin otherwise.
 */
function resolveFrontendOrigin(origin: string | undefined): string {
  if (origin && isAllowedOrigin(origin)) return origin;
  if (config.FRONTEND_ORIGIN) return config.FRONTEND_ORIGIN;
  const fromList = config.FRONTEND_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return fromList || "https://courser2.vercel.app";
}

/** Derive a username from a Google email; collisions get a short hex suffix. */
function usernameFromEmail(email: string): string {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30) || "user";
  return base;
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
    await db.query(`UPDATE users SET is_verified = TRUE WHERE id = $1`, [user.id]);
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

    // Accounts are verified instantly (email format is validated above);
    // the session cookies are issued in the same response.
    const verified = { ...user, is_verified: true };
    const tokens = await authService.issueTokens(verified);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    setSessionCookie(res, verified, tokens.accessToken);
    res.status(201).json(tokenResponse(verified, tokens.accessToken, tokens.refreshToken, tokens.sessionExpiresAt));
  })
);

router.post(
  "/login",
  loginLimiter,
  wrap(async (req, res) => {
    const data = validate(LoginSchema, req.body);
    const identifier = (data.identifier ?? data.email ?? "").trim();
    const user = await authService.authenticateUser(identifier, data.password);
    if (!user) {
      throw unauthorized("Invalid email or password.");
    }
    const tokens = await authService.issueTokens(user, data.remember_me);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, data.remember_me);
    setSessionCookie(res, user, tokens.accessToken);
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
    setSessionCookie(res, rotated.user, rotated.accessToken);
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
  "/google",
  wrap(async (req, res) => {
    const origin = resolveFrontendOrigin(
      typeof req.query.origin === "string" ? req.query.origin : undefined
    );
    // Not configured → send the user back to the app with a readable banner
    // instead of an ugly 503 error page mid-redirect.
    if (!isGoogleConfigured()) {
      res.redirect(302, `${origin}/auth?google=error&reason=config`);
      return;
    }
    const state = randomBytes(24).toString("hex");
    setGoogleStateCookie(res, { state, origin });
    res.redirect(302, googleAuthorizeUrl(state));
  })
);

router.get(
  "/google/callback",
  wrap(async (req, res) => {
    // Read the state bundle set by /google. Its origin wins so the user lands
    // back on whichever frontend they started from (dev or one of the prod
    // projects), and its state must match Google's echo to block login CSRF.
    let bundle: { state?: string; origin?: string } | null = null;
    try {
      const raw = req.cookies?.[GOOGLE_STATE_COOKIE] as string | undefined;
      if (raw) bundle = JSON.parse(decodeURIComponent(raw)) as { state?: string; origin?: string };
    } catch {
      bundle = null;
    }
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const targetOrigin = resolveFrontendOrigin(
      bundle && typeof bundle.origin === "string" ? bundle.origin : undefined
    );

    const fail = (reason: string): void => {
      res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/" });
      res.redirect(302, `${targetOrigin}/auth?google=error&reason=${reason}`);
    };

    // CSRF guard: no state cookie or mismatch → reject before exchanging.
    if (!bundle || bundle.state !== state) return fail("state");
    // User cancelled at Google's consent screen.
    if (req.query.error) return fail("denied");
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) return fail("code");

    let profile: GoogleProfile;
    try {
      ({ profile } = await exchangeGoogleCode(code));
    } catch {
      return fail("exchange");
    }
    // A Google account whose email isn't verified is exceedingly rare; refuse
    // to create an account for it rather than skip the verified-email rule.
    if (!profile.emailVerified) return fail("email");

    const email = profile.email.toLowerCase();
    let user = await authService.getUserByEmail(email);
    if (!user) {
      // New account: random password (login happens via Google), role student,
      // pre-verified because Google already verified the email.
      let username = usernameFromEmail(email);
      const taken = await db.get<{ id: string }>(
        `SELECT id FROM users WHERE username = $1`,
        [username]
      );
      if (taken) username = `${username.slice(0, 24)}${randomBytes(3).toString("hex")}`;
      user = await authService.createUser(username, email, randomBytes(24).toString("hex"), {
        fullName: profile.name,
        role: "student",
        verified: true,
        avatarUrl: profile.picture,
      });
    } else {
      // Existing account: Google-verified ⇒ mark verified; adopt Google profile
      // data only where the account has none (never overwrite user-set values).
      const sets: string[] = [];
      const params: unknown[] = [user.id];
      let i = 2;
      const mark = (field: string, value: unknown): void => {
        sets.push(`${field} = $${i++}`);
        params.push(value);
      };
      if (!user.is_verified) mark("is_verified", true);
      if (user.avatar_url == null && profile.picture) mark("avatar_url", profile.picture);
      if ((user.full_name == null || user.full_name === "") && profile.name) {
        mark("full_name", profile.name);
      }
      mark("failed_login_attempts", 0);
      mark("locked_until", null);
      mark("last_login", nowIso());
      if (sets.length) await db.query(`UPDATE users SET ${sets.join(", ")} WHERE id = $1`, params);
      user = (await authService.getUserById(user.id)) ?? user;
    }

    const tokens = await authService.issueTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    setSessionCookie(res, user, tokens.accessToken);
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/" });
    // Pass the short-lived access token in the URL fragment (not query string,
    // so it's never sent to the server) so the SPA can read it client-side on
    // cross-origin setups where Safari/iOS ITP blocks the HttpOnly cookies.
    // The SPA stores it in its own origin cookie + Authorization header, making
    // subsequent API calls work without relying on cross-origin cookie storage.
    res.redirect(302, `${targetOrigin}/auth?google=success#access_token=${encodeURIComponent(tokens.accessToken)}`);
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