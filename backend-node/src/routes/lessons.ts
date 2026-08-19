/**
 * Lesson endpoints — mirrors backend/app/api/lessons.py.
 *
 * GET /lessons/:id (public), POST /lessons/:id/complete and
 * PATCH /lessons/:id/progress (authenticated). Progress is persisted per
 * (user, lesson) in `lesson_progress`; the parent course's `enrollments`
 * progress is recomputed as the average across its lessons, and completing a
 * lesson (or ≥50% progress) records a learning day for the streak.
 */
import { Router } from "express";
import { z } from "zod";

import { db } from "../db.js";
import type { Row } from "../db.js";
import { notFound, wrap } from "../errors.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";
import { normalizeDt, nowIso } from "../serialize.js";
import { recordLearningDay } from "../services/streakService.js";
import { validate } from "../validate.js";

export const router = Router();

const ProgressSchema = z.object({
  progress: z.number(),
  quiz_score: z.number().nullish(),
});

interface LessonRow extends Row {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration: string | null;
  order: number;
  is_published: boolean;
  resource_links: unknown | null;
  created_at: string | null;
}

function lessonDict(l: LessonRow, extra?: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: l.id,
    title: l.title,
    content: l.content,
    video_url: l.video_url,
    duration: l.duration,
    order: l.order,
    is_published: l.is_published,
    resource_links: l.resource_links ?? [],
    created_at: normalizeDt(l.created_at),
  };
  if (extra) Object.assign(payload, extra);
  return payload;
}

async function courseIdForLesson(lesson: LessonRow): Promise<string | null> {
  const module = await db.get<{ course_id: string }>(`SELECT course_id FROM modules WHERE id = $1`, [
    lesson.module_id,
  ]);
  return module ? module.course_id : null;
}

async function upsertLessonProgress(
  userId: string,
  lessonId: string,
  progress: number,
  quizScore?: number | null
): Promise<void> {
  const existing = await db.get<Row>(
    `SELECT id FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2`,
    [userId, lessonId]
  );
  const isCompleted = progress >= 100.0;
  const completedAt = isCompleted ? nowIso() : null;
  if (existing) {
    await db.query(
      `UPDATE lesson_progress
          SET progress = $3, is_completed = $4, quiz_score = $5, completed_at = $6, updated_at = $7
        WHERE id = $1`,
      [existing.id, null, progress, isCompleted, quizScore ?? null, completedAt, nowIso()]
    );
  } else {
    await db.query(
      `INSERT INTO lesson_progress
         (id, user_id, lesson_id, progress, is_completed, quiz_score, completed_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [crypto.randomUUID(), userId, lessonId, progress, isCompleted, quizScore ?? null, completedAt, nowIso()]
    );
  }
}

async function recomputeCourseProgress(
  userId: string,
  courseId: string
): Promise<{ percent: number; completed: number; total: number }> {
  const lessons = await db.query<{ id: string }>(
    `SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = $1`,
    [courseId]
  );
  const total = lessons.length;
  if (total === 0) return { percent: 0.0, completed: 0, total: 0 };

  const progressRows = await db.query<Row>(
    `SELECT lesson_id, progress, is_completed FROM lesson_progress
      WHERE user_id = $1 AND lesson_id = ANY($2)`,
    [userId, lessons.map((l) => l.id)]
  );
  const byId = new Map(progressRows.map((r) => [r.lesson_id, r]));
  let completed = 0;
  let sum = 0;
  for (const l of lessons) {
    const row = byId.get(l.id);
    if (row && row.is_completed) completed += 1;
    sum += row ? Number(row.progress) : 0.0;
  }
  const average = sum / total;

  await db.query(
    `UPDATE enrollments
        SET progress = $3,
            completed_at = CASE WHEN $4::float >= 100 THEN $5 ELSE completed_at END
      WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId, Math.round(average * 100) / 100, average, nowIso()]
  );
  return { percent: average, completed, total };
}

router.get(
  "/:lesson_id",
  wrap(async (req, res) => {
    const lesson = await db.get<LessonRow>(`SELECT * FROM lessons WHERE id = $1`, [
      req.params.lesson_id,
    ]);
    if (!lesson) throw notFound("Lesson not found");
    res.json(lessonDict(lesson));
  })
);

router.post(
  "/:lesson_id/complete",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const lesson = await db.get<LessonRow>(`SELECT * FROM lessons WHERE id = $1`, [
      req.params.lesson_id,
    ]);
    if (!lesson) throw notFound("Lesson not found");

    await upsertLessonProgress(userId, lesson.id, 100.0);
    const courseId = await courseIdForLesson(lesson);
    const courseProgress = courseId ? await recomputeCourseProgress(userId, courseId) : null;
    await recordLearningDay(userId);

    res.json(
      lessonDict(lesson, {
        is_completed: true,
        progress: 100.0,
        course_progress_percent: courseProgress ? Math.trunc(courseProgress.percent) : null,
        completed_lessons: courseProgress ? courseProgress.completed : null,
        total_lessons: courseProgress ? courseProgress.total : null,
      })
    );
  })
);

router.patch(
  "/:lesson_id/progress",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = validate(ProgressSchema, req.body);
    const lesson = await db.get<LessonRow>(`SELECT * FROM lessons WHERE id = $1`, [
      req.params.lesson_id,
    ]);
    if (!lesson) throw notFound("Lesson not found");

    // Clamp progress so a buggy/abusive client can't write values outside
    // 0–100 (which would corrupt the course progress average).
    const progress = Math.max(0, Math.min(Number(data.progress), 100));

    await upsertLessonProgress(userId, lesson.id, progress, data.quiz_score);
    const courseId = await courseIdForLesson(lesson);
    const courseProgress = courseId ? await recomputeCourseProgress(userId, courseId) : null;
    if (progress >= 50.0) await recordLearningDay(userId);

    res.json(
      lessonDict(lesson, {
        is_completed: progress >= 100.0,
        progress,
        quiz_score: data.quiz_score ?? null,
        course_progress_percent: courseProgress ? Math.trunc(courseProgress.percent) : null,
        completed_lessons: courseProgress ? courseProgress.completed : null,
        total_lessons: courseProgress ? courseProgress.total : null,
      })
    );
  })
);

/** ---------- Lesson quiz routes (end-of-lesson mastery self-check) ---------- */
import crypto from "crypto";

interface LessonQuiz {
  pass_percent: number;
  questions: { question: string; options: string[]; correct_index: number; explanation?: string }[];
}

const LessonResultSchema = z.object({
  score: z.number(),
  passed: z.boolean(),
  total_questions: z.number().int().default(0),
});

async function loadLessonForQuiz(lessonId: string): Promise<Row | null> {
  return db.get<Row>(`SELECT id, title, quiz FROM lessons WHERE id = $1`, [lessonId]);
}

function lessonQuizFor(lesson: Row): LessonQuiz | null {
  return (lesson.quiz as LessonQuiz | null) ?? null;
}

function lessonQuizJson(lesson: Row): Record<string, unknown> | null {
  const quiz = lessonQuizFor(lesson);
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

router.get(
  "/:lesson_id/quiz",
  requireUser,
  wrap(async (req, res) => {
    const lesson = await loadLessonForQuiz(req.params.lesson_id);
    if (!lesson) throw notFound("Lesson not found");
    const quiz = lessonQuizFor(lesson);
    if (!quiz) throw notFound("This lesson has no quiz");
    res.json(quiz);
  })
);

router.get(
  "/:lesson_id/quiz/result",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const lesson = await loadLessonForQuiz(req.params.lesson_id);
    if (!lesson) {
      res.json(null);
      return;
    }
    const quiz = lessonQuizFor(lesson);
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
      created_at: normalizeDt(row.created_at as string | null),
    });
  })
);

router.post(
  "/:lesson_id/quiz/result",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = validate(LessonResultSchema, req.body);
    const lesson = await loadLessonForQuiz(req.params.lesson_id);
    if (!lesson) throw notFound("Lesson not found");
    const quiz = lessonQuizFor(lesson);
    if (!quiz) throw notFound("This lesson has no quiz");
    const total = data.total_questions || quiz.questions.length;
    const score = Math.max(0, Math.min(data.score, 100));
    const passed = score >= quiz.pass_percent;

    const rows = await db.query<{ created_at: string }>(
      `INSERT INTO quiz_results (id, user_id, lesson_id, score, passed, total_questions, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING created_at`,
      [crypto.randomUUID(), userId, lesson.id, score, passed, total, new Date().toISOString()]
    );
    res.status(201).json({
      lesson_id: lesson.id,
      score,
      passed,
      total_questions: total,
      pass_percent: quiz.pass_percent,
      created_at: normalizeDt(rows[0]?.created_at ?? new Date().toISOString()),
    });
  })
);