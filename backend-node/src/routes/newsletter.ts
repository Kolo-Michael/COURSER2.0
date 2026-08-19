/**
 * Newsletter subscribe endpoint.
 *
 * Validates the email shape and stores the subscription in the `newsletters`
 * table (deduped on email via ON CONFLICT). Replies with a generic success so
 * the footer form gets a stable wire format.
 */
import { Router } from "express";
import { z } from "zod";

import { db } from "../db.js";
import { wrap } from "../errors.js";
import { normalizeEmail, validate } from "../validate.js";

export const router = Router();

const SubscribeSchema = z.object({ email: z.string().email() });

router.post(
  "/subscribe",
  wrap(async (req, res) => {
    const data = validate(SubscribeSchema, req.body);
    const email = normalizeEmail(data.email);
    const source = typeof req.body?.source === "string" ? req.body.source.slice(0, 40) : "site_footer";
    await db.query(
      `INSERT INTO newsletters (id, email, source)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [crypto.randomUUID(), email, source]
    );
    res.json({ ok: true, message: "Subscribed." });
  })
);