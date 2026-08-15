/**
 * Streak endpoints — mirrors backend/app/api/streak.py.
 *
 *   GET  /streak          — current streak + restore availability
 *   POST /streak/restore  — spend one of this month's restores to back-fill
 *                           the most recent skipped learning day
 *
 * Both require a valid access token (Bearer or cookie).
 */
import { Router } from "express";

import { badRequest, wrap } from "../errors.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";
import { getStreak, restoreSkippedDay } from "../services/streakService.js";

export const router = Router();

router.get(
  "/",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    res.json(await getStreak(userId));
  })
);

router.post(
  "/restore",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const [payload, error] = await restoreSkippedDay(userId);
    if (error) throw badRequest(error);
    res.json(payload);
  })
);