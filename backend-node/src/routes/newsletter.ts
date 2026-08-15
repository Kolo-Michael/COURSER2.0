/**
 * Newsletter subscribe endpoint — mirrors backend/app/api/newsletter.py.
 *
 * Validates the email shape and logs it; no persistence yet, so the wire
 * format won't break when a table is added later.
 */
import { Router } from "express";
import { z } from "zod";

import { wrap } from "../errors.js";
import { normalizeEmail, validate } from "../validate.js";

export const router = Router();

const SubscribeSchema = z.object({ email: z.string().email() });

router.post(
  "/subscribe",
  wrap(async (req, res) => {
    const data = validate(SubscribeSchema, req.body);
    const email = normalizeEmail(data.email);
    console.log(`newsletter subscribe: ${email}`);
    res.json({ ok: true, message: "Subscribed." });
  })
);