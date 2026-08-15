/**
 * Express auth middleware — mirrors the FastAPI `get_current_user_id` and
 * `_require_admin_or_above` dependencies in the Python routers.
 */
import type { NextFunction, Request, Response } from "express";

import { forbidden, unauthorized } from "../errors.js";
import { getAccessToken, getCurrentUserId } from "../security.js";
import { getUserById } from "../services/authService.js";
import type { UserRow } from "../services/authService.js";

export interface AuthedRequest extends Request {
  userId: string;
  user?: UserRow;
}

/** Resolve the authenticated user id from token/cookie; 401 if absent. */
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  try {
    (req as AuthedRequest).userId = getCurrentUserId(req);
    next();
  } catch (err) {
    next(err);
  }
}

/** Fetch the User row for the authenticated principal; 401 if it's gone. */
export async function requireUserRow(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getCurrentUserId(req);
    const user = await getUserById(userId);
    if (!user) throw unauthorized("User not found");
    (req as AuthedRequest).userId = userId;
    (req as AuthedRequest).user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Require an authenticated principal whose DB role is admin or super_admin. */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getAccessToken(req);
    if (!token) throw unauthorized("Not authenticated");
    const { decodeToken } = await import("../security.js");
    const decoded = decodeToken(token, "access");
    const user = await getUserById(decoded.sub);
    if (!user) throw unauthorized("User not found");
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw forbidden("Admin only");
    }
    (req as AuthedRequest).user = user;
    (req as AuthedRequest).userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}