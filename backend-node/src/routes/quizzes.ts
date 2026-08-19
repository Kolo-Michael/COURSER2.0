/**
 * Module quiz endpoints — end-of-module mastery checks.
 *
 * GET  /modules/:module_id/quiz         → questions + pass threshold
 * GET  /modules/:module_id/quiz/result  → latest attempt for the user (or null)
 * POST /modules/:module_id/quiz/result  → record a scored attempt
 *
 * Quizzes live on the `modules.quiz` JSONB column (seeded per module); results
 * are stored per (user, module) in `quiz_results` so learners can retake and
 * the workspace can show "passed ✓".
 */
import { Router } from "express";
import { z } from "zod";

import { db } from "../db.js";
import type { Row } from "../db.js";
import { notFound, wrap } from "../errors.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";
import { normalizeDt } from "../serialize.js";
import { validate } from "../validate.js";

export const router = Router();

interface Quiz {
  pass_percent: number;
  questions: { question: string; options: string[]; correct_index: number; explanation?: string }[];
}

const ResultSchema = z.object({
  score: z.number(),
  passed: z.boolean(),
  total_questions: z.number().int().default(0),
});

async function loadModule(moduleId: string): Promise<Row | null> {
  return db.get<Row>(`SELECT id, title, quiz FROM modules WHERE id = $1`, [moduleId]);
}

function quizFor(module: Row): Quiz | null {
  return (module.quiz as Quiz | null) ?? null;
}

function quizJson(module: Row): Record<string, unknown> | null {
  const quiz = quizFor(module);
  if (!quiz) return null;
  return {
    module_id: module.id,
    title: module.title,
    pass_percent: quiz.pass_percent,
    questions: quiz.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation ?? null,
    })),
  };
}

router.get(
  "/:module_id/quiz",
  requireUser,
  wrap(async (req, res) => {
    const module = await loadModule(req.params.module_id);
    if (!module) throw notFound("Module not found");
    const quiz = quizJson(module);
    if (!quiz) throw notFound("This module has no quiz");
    res.json(quiz);
  })
);

router.get(
  "/:module_id/quiz/result",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const module = await loadModule(req.params.module_id);
    if (!module) throw notFound("Module not found");
    const row = await db.get<Row>(
      `SELECT id, score, passed, total_questions, created_at FROM quiz_results
        WHERE user_id = $1 AND module_id = $2
        ORDER BY created_at DESC LIMIT 1`,
      [userId, module.id]
    );
    if (!row) {
      res.json(null);
      return;
    }
    res.json({
      id: row.id,
      module_id: module.id,
      score: Number(row.score),
      passed: Boolean(row.passed),
      total_questions: Number(row.total_questions),
      created_at: normalizeDt(row.created_at as string | null),
    });
  })
);

router.post(
  "/:module_id/quiz/result",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = validate(ResultSchema, req.body);
    const module = await loadModule(req.params.module_id);
    if (!module) throw notFound("Module not found");
    const quiz = quizFor(module);
    if (!quiz) throw notFound("This module has no quiz");
    // Clamp so a client can't self-certify a passing score for nothing.
    const total = data.total_questions || quiz.questions.length;
    const score = Math.max(0, Math.min(data.score, 100));
    const passed = score >= quiz.pass_percent;

    const rows = await db.query<{ created_at: string }>(
      `INSERT INTO quiz_results (id, user_id, module_id, score, passed, total_questions, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING created_at`,
      [crypto.randomUUID(), userId, module.id, score, passed, total, new Date().toISOString()]
    );
    res.status(201).json({
      module_id: module.id,
      score,
      passed,
      total_questions: total,
      pass_percent: quiz.pass_percent,
      created_at: normalizeDt(rows[0]?.created_at ?? new Date().toISOString()),
    });
  })
);