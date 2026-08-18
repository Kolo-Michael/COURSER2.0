/**
 * Lesson quiz endpoints — per-lesson mastery self-check.
 *
 * Lessons may have a `quiz` jsonb column (4 questions, pass_percent: 70).
 * Results are stored in `quiz_results` per (user, lesson) so the workspace can
 * show "passed ✓" and gate advancement.
 *
 * GET  /api/lessons/:lesson_id/quiz         → questions + pass threshold
 * GET  /api/lessons/:lesson_id/quiz/result   → latest attempt for the user (or null)
 * POST /api/lessons/:lesson_id/quiz/result   → record a scored attempt
 *
 * Quizzes live on the `lessons.quiz` JSONB column; results are stored in
 * `quiz_results` so learners can retake and the workspace can show "passed ✓".
 */
import { Router } from "express";
import { z } from "zod";

import { db } from "../db.js";
import type { Row } from "../db.js";
import { notFound, wrap } from "../errors.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";
import { validate } from "../validate.js";

interface LessonQuiz {
  pass_percent: number;
  questions: { question: string; options: string[]; correct_index: number; explanation?: string }[];
}

const ResultSchema = z.object({
  score: z.number(),
  passed: z.boolean(),
  total_questions: z.number().int().default(0),
});

async function loadLesson(lessonId: string): Promise<Row | null> {
  return db.get<Row>(`SELECT id, title, quiz FROM lessons WHERE id = $1`, [lessonId]);
}

function lessonQuiz(lesson: Row): LessonQuiz | null {
  return (lesson.quiz as LessonQuiz | null) ?? null;
}

function lessonQuizJson(lesson: Row): Record<string, unknown> | null {
  const quiz = lessonQuiz(lesson);
  if (!quiz) return null;
  return {
    lesson_id: lesson.id,
    title: lesson.title,
    pass_percent: quiz.pass_percent,
    questions: quiz.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation ?? null,
    })),
  };
}

export const router = Router();

router.get(
  "/:lesson_id/quiz",
  requireUser,
  wrap(async (req, res) => {
    const lesson = await loadLesson(req.params.lesson_id);
    if (!lesson) throw notFound("Lesson not found");
    const quiz = lessonQuiz(lesson);
    if (!quiz) throw notFound("This lesson has no quiz");
    res.json(quiz);
  })
);

router.get(
  "/:lesson_id/quiz/result",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const lesson = await loadLesson(req.params.lesson_id);
    if (!lesson) {
      res.json(null);
      return;
    }
    const quiz = lessonQuiz(lesson);
    if (!quiz) {
      // No quiz authored for this lesson yet — treat as "no gate"
      res.json(null);
      return;
    }
    const row = await db.get<Row>(
      `SELECT id, score, passed, total_questions, created_at FROM quiz_results
        WHERE user_id = $1 AND lesson_id = $2
        ORDER BY created_at DESC LIMIT 1`,
      [userId, lesson.id]
    );
    if (!row) {
      res.json(null);
      return;
    }
    res.json({
      id: row.id,
      lesson_id: lesson.id,
      score: Number(row.score),
      passed: Boolean(row.passed),
      total_questions: Number(row.total_questions),
      created_at: new Date().toISOString(),
    });
  })
);

router.post(
  "/:lesson_id/quiz/result",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = validate(ResultSchema, req.body);
    const lesson = await loadLesson(req.params.lesson_id);
    if (!lesson) throw notFound("Lesson not found");
    const quiz = lessonQuiz(lesson);
    if (!quiz) throw notFound("This lesson has no quiz");
    const total = data.total_questions || quiz.questions.length;
    const score = Math.max(0, Math.min(data.score, 100));
    const passed = score >= quiz.pass_percent;

    await db.query(
      `INSERT INTO quiz_results (id, user_id, lesson_id, score, passed, total_questions, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [crypto.randomUUID(), userId, lesson.id, score, passed, total, new Date().toISOString()]
    );
    res.status(201).json({
      lesson_id: lesson.id,
      score,
      passed,
      total_questions: total,
      pass_percent: quiz.pass_percent,
      created_at: new Date().toISOString(),
    });
  })
);

export { lessonQuiz, lessonQuizJson };