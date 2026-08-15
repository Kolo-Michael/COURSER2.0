/**
 * Request body validation with zod, producing FastAPI-shaped 422 errors.
 *
 * Pydantic 422 responses look like
 *   { "detail": [ { "loc": [...], "msg": "...", "type": "..." } ] }.
 * `validate` throws an HttpError(422) built from the zod issues so the
 * central error middleware renders that shape.
 */
import { z } from "zod";

import { HttpError } from "./errors.js";

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const detail = result.error.issues.map((issue) => ({
      loc: ["body", ...issue.path.map(String)],
      msg: issue.message,
      type: issue.code,
    }));
    throw new HttpError(422, detail);
  }
  return result.data;
}

/** Lowercase the domain part of an email, matching Pydantic's EmailStr. */
export function normalizeEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at === -1) return email.trim().toLowerCase();
  return `${email.slice(0, at)}${email.slice(at).toLowerCase()}`;
}