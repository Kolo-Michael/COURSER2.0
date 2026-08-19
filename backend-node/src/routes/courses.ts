/**
 * Course catalog + management — mirrors backend/app/api/courses.py.
 *
 * Public read endpoints (categories, list, get by id/slug) fall back to the
 * hardcoded catalog when the DB is unreachable; mutating endpoints require an
 * admin/super_admin. Student actions (enroll, restart, conversation list,
 * ask Cora) require any authenticated user.
 */
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { db } from "../db.js";
import type { Row } from "../db.js";
import { badRequest, forbidden, notFound, unauthorized, wrap } from "../errors.js";
import { fallbackCourseBySlug, FALLBACK_CATEGORIES, FALLBACK_COURSES, type FallbackCourse } from "../fallbacks.js";
import { requireAdmin, requireUser, type AuthedRequest } from "../middleware/auth.js";
import { getAccessToken } from "../security.js";
import { normalizeDt } from "../serialize.js";
import { answerCourseQuestion, findOwnedConversation } from "../services/aiService.js";
import { getUserById } from "../services/authService.js";
import { generateCoursePdf } from "../services/pdfService.js";
import { validate } from "../validate.js";

export const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string): string {
  if (!UUID_RE.test(value)) {
    throw new HttpError422(`"${value}" is not a valid UUID`);
  }
  return value;
}

// Local shim to build FastAPI-shaped 422s without importing the router cycle.
import { HttpError } from "../errors.js";
class HttpError422 extends HttpError {
  constructor(detail: string) {
    super(422, [
      { loc: ["path"], msg: detail, type: "value_error" },
    ]);
  }
}

// --- schemas (mirror backend/app/schemas/course.py) -----------------------

const LessonCreateSchema = z.object({
  title: z.string(),
  content: z.string().nullish(),
  video_url: z.string().nullish(),
  duration: z.string().nullish(),
  order: z.number().int().default(0),
  is_published: z.boolean().default(false),
});

const ModuleCreateSchema = z.object({
  title: z.string(),
  description: z.string().nullish(),
  order: z.number().int().default(0),
  lessons: z.array(LessonCreateSchema).default([]),
});

const CourseCreateSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  short_description: z.string().nullish(),
  level: z.string().default("beginner"),
  duration: z.string().nullish(),
  price: z.number().default(0),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_ai_generated: z.boolean().default(false),
  image_url: z.string().nullish(),
  category_id: z.string().regex(UUID_RE).nullish(),
  instructor_id: z.string().regex(UUID_RE).nullish(),
  modules: z.array(ModuleCreateSchema).default([]),
});

// Body accepted by POST /slug/:slug/enroll — the course onboarding survey.
const EnrollSchema = z.object({
  skill_level: z.enum(["beginner", "intermediate", "expert"]).optional().default("beginner"),
  learning_goal: z.string().optional().nullable(),
});

// Body accepted by PATCH /enrollments/:id/onboarding.
const OnboardingUpdateSchema = z.object({
  skill_level: z.enum(["beginner", "intermediate", "expert"]).optional(),
  learning_goal: z.string().optional().nullable(),
});

const CourseUpdateSchema = z
  .object({
    title: z.string().nullish(),
    slug: z.string().nullish(),
    description: z.string().nullish(),
    short_description: z.string().nullish(),
    level: z.string().nullish(),
    duration: z.string().nullish(),
    price: z.number().nullish(),
    is_published: z.boolean().nullish(),
    is_featured: z.boolean().nullish(),
    image_url: z.string().nullish(),
    category_id: z.string().regex(UUID_RE).nullish(),
  })
  .partial();

const AskSchema = z.object({
  question: z.string().min(1).max(2000),
  conversation_id: z.string().regex(UUID_RE).nullish(),
});

// --- serializers ----------------------------------------------------------

interface CategoryRow extends Row {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string | null;
}

interface CourseRow extends Row {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  level: string;
  duration: string | null;
  price: number;
  is_published: boolean;
  is_featured: boolean;
  is_ai_generated: boolean;
  image_url: string | null;
  category_id: string | null;
  instructor_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ModuleRow extends Row {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  quiz: unknown | null;
  created_at: string | null;
}

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

function categoryJson(c: CategoryRow): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    created_at: normalizeDt(c.created_at),
  };
}

function lessonJson(l: LessonRow, extra?: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: l.id,
    module_id: l.module_id,
    title: l.title,
    content: l.content,
    video_url: l.video_url,
    duration: l.duration,
    order: l.order,
    is_published: l.is_published,
    resource_links: l.resource_links ?? [],
    resources: [],
    created_at: normalizeDt(l.created_at),
    progress: null,
    is_completed: null,
  };
  if (extra) Object.assign(payload, extra);
  return payload;
}

function moduleJson(m: ModuleRow, lessons: Record<string, unknown>[]): Record<string, unknown> {
  return {
    id: m.id,
    course_id: m.course_id,
    title: m.title,
    description: m.description,
    order: m.order,
    quiz: m.quiz ?? null,
    quiz_result: null,
    created_at: normalizeDt(m.created_at),
    lessons,
  };
}

function courseJson(
  c: CourseRow,
  category: CategoryRow | null,
  modules: { module: ModuleRow; lessons: Record<string, unknown>[] }[]
): Record<string, unknown> {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    short_description: c.short_description,
    level: c.level,
    duration: c.duration,
    price: c.price,
    is_published: c.is_published,
    is_featured: c.is_featured,
    is_ai_generated: c.is_ai_generated,
    image_url: c.image_url,
    category_id: c.category_id,
    instructor_id: c.instructor_id,
    created_at: normalizeDt(c.created_at),
    updated_at: normalizeDt(c.updated_at),
    category: category ? categoryJson(category) : null,
    modules: modules.map((m) => moduleJson(m.module, m.lessons)),
  };
}

function courseListJson(c: CourseRow, category: CategoryRow | null, lessonCount: number): Record<string, unknown> {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    short_description: c.short_description,
    level: c.level,
    duration: c.duration,
    price: c.price,
    is_published: c.is_published,
    is_featured: c.is_featured,
    is_ai_generated: c.is_ai_generated,
    image_url: c.image_url,
    lesson_count: lessonCount,
    category: category ? categoryJson(category) : null,
  };
}

// --- loaders --------------------------------------------------------------

async function loadCategory(categoryId: string | null): Promise<CategoryRow | null> {
  if (!categoryId) return null;
  return db.get<CategoryRow>(`SELECT * FROM categories WHERE id = $1`, [categoryId]);
}

async function loadCourseTree(course: CourseRow): Promise<Record<string, unknown>> {
  const category = await loadCategory(course.category_id);
  const modules = await db.query<ModuleRow>(
    `SELECT * FROM modules WHERE course_id = $1 ORDER BY "order"`,
    [course.id]
  );
  const lessons = await db.query<LessonRow>(
    `SELECT * FROM lessons WHERE module_id = ANY($1) ORDER BY "order"`,
    [modules.map((m) => m.id)]
  );
  const byModule = new Map<string, LessonRow[]>();
  for (const l of lessons) {
    const list = byModule.get(l.module_id) || [];
    list.push(l);
    byModule.set(l.module_id, list);
  }

  // Attach imported (license-compliant) reading material per lesson so the
  // Resources tab can render full articles in-app, not just link out.
  const imported = await db.query<Row>(
    `SELECT id, lesson_id, source, title, url, license, body, fetched_at
       FROM lesson_resources
      WHERE lesson_id = ANY($1)
      ORDER BY fetched_at ASC`,
    [lessons.map((l) => l.id)]
  );
  const importedByLesson = new Map<string, Row[]>();
  for (const r of imported) {
    const list = importedByLesson.get(r.lesson_id as string) || [];
    list.push(r);
    importedByLesson.set(r.lesson_id as string, list);
  }

  return courseJson(
    course,
    category,
    modules.map((m) => ({
      module: m,
      lessons: (byModule.get(m.id) || []).map((l) =>
        lessonJson(l, {
          resources: (importedByLesson.get(l.id) || []).map((r) => ({
            id: r.id,
            source: r.source,
            title: r.title,
            url: r.url,
            license: r.license ?? null,
            body: r.body ?? null,
            fetched_at: normalizeDt(r.fetched_at as string | null),
          })),
        })
      ),
    }))
  );
}

/** Attach per-lesson progress/is_completed when a valid token is present. */
async function attachLessonProgress(
  req: AuthedRequest,
  payload: {
    modules: { id: string; quiz_result?: unknown; lessons: Record<string, unknown>[] }[]
  }
): Promise<void> {
  const token = getAccessToken(req);
  if (!token) return;
  let userId: string;
  try {
    const { decodeToken } = await import("../security.js");
    userId = decodeToken(token, "access").sub;
  } catch {
    return;
  }
  const lessonIds: string[] = [];
  const moduleIds: string[] = [];
  for (const m of payload.modules) {
    moduleIds.push(m.id);
    for (const l of m.lessons) lessonIds.push(l.id as string);
  }
  if (!lessonIds.length) return;
  const rows = await db.query<{ lesson_id: string; progress: number; is_completed: boolean }>(
    `SELECT lesson_id, progress, is_completed FROM lesson_progress
      WHERE user_id = $1 AND lesson_id = ANY($2)`,
    [userId, lessonIds]
  );
  const byId = new Map(rows.map((r) => [r.lesson_id, r]));
  for (const m of payload.modules) {
    for (const l of m.lessons) {
      const row = byId.get(l.id as string);
      l.progress = row ? row.progress : 0.0;
      l.is_completed = row ? Boolean(row.is_completed) : false;
    }
  }
  // Latest quiz attempt per module, so the workspace can show "passed ✓".
  if (moduleIds.length) {
    const results = await db.query<Row>(
      `SELECT DISTINCT ON (module_id) module_id, id, score, passed, total_questions, created_at
         FROM quiz_results
        WHERE user_id = $1 AND module_id = ANY($2)
        ORDER BY module_id, created_at DESC`,
      [userId, moduleIds]
    );
    const resultByModule = new Map(results.map((r) => [r.module_id, r]));
    for (const m of payload.modules) {
      const result = resultByModule.get(m.id as string);
      if (result) {
        m.quiz_result = {
          id: result.id,
          score: Number(result.score),
          passed: Boolean(result.passed),
          total_questions: Number(result.total_questions),
          created_at: normalizeDt(result.created_at as string | null),
        };
      }
    }
  }
}

// --- public read endpoints ------------------------------------------------

router.get(
  "/categories",
  wrap(async (_req, res) => {
    try {
      const rows = await db.query<CategoryRow>(`SELECT * FROM categories ORDER BY name`);
      res.json(rows.map(categoryJson));
    } catch {
      res.json(FALLBACK_CATEGORIES);
    }
  })
);

router.get(
  "/",
  wrap(async (req, res) => {
    const published = req.query.published === "true" ? true : req.query.published === "false" ? false : null;
    const featured = req.query.featured === "true" ? true : req.query.featured === "false" ? false : null;

    const where: string[] = [];
    const params: unknown[] = [];
    if (published !== null) {
      params.push(published);
      where.push(`c.is_published = $${params.length}`);
    }
    if (featured !== null) {
      params.push(featured);
      where.push(`c.is_featured = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    try {
      const rows = await db.query<CourseRow & { cat_id: string | null; lesson_count: string | null }>(
        `SELECT c.*, cat.id AS cat_id, cat.name AS cat_name, cat.slug AS cat_slug,
                cat.description AS cat_description, cat.icon AS cat_icon,
                cat.created_at AS cat_created_at,
                (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id
                  WHERE m.course_id = c.id) AS lesson_count
           FROM courses c
           LEFT JOIN categories cat ON cat.id = c.category_id
           ${whereSql}
           ORDER BY c.created_at DESC`,
        params
      );
      const out = rows.map((r) => {
        const category: CategoryRow | null = r.cat_id
          ? {
              id: r.cat_id,
              name: r.cat_name as string,
              slug: r.cat_slug as string,
              description: (r.cat_description as string | null) ?? null,
              icon: (r.cat_icon as string | null) ?? null,
              created_at: (r.cat_created_at as string | null) ?? null,
            }
          : null;
        return courseListJson(r as unknown as CourseRow, category, Number(r.lesson_count) || 0);
      });
      res.json(out);
    } catch {
      let courses = FALLBACK_COURSES;
      if (published !== null) courses = courses.filter((c) => c.is_published === published);
      if (featured !== null) courses = courses.filter((c) => c.is_featured === featured);
      res.json(
        courses.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          short_description: c.short_description,
          level: c.level,
          duration: c.duration,
          price: c.price,
          is_published: c.is_published,
          is_featured: c.is_featured,
          is_ai_generated: c.is_ai_generated,
          image_url: (c as { image_url?: string | null }).image_url ?? null,
          lesson_count: c.modules.reduce((n, m) => n + m.lessons.length, 0),
          category: c.category,
        }))
      );
    }
  })
);

router.get(
  "/enrollments/me",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
       const rows = await db.query<Row>(
       `SELECT e.id, e.course_id, e.skill_level, e.learning_goal, e.enrolled_at, e.completed_at, e.progress,
               c.title AS course_title, c.slug AS course_slug, c.level, c.image_url AS course_image_url,
               cat.name AS course_category
          FROM enrollments e
          JOIN courses c ON c.id = e.course_id
          LEFT JOIN categories cat ON cat.id = c.category_id
         WHERE e.user_id = $1
         ORDER BY e.enrolled_at DESC`,
       [userId]
     );
    const out: Record<string, unknown>[] = [];
    for (const e of rows) {
      const courseId = e.course_id as string;
      const lessons = await db.query<{ id: string }>(
        `SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id
          WHERE m.course_id = $1`,
        [courseId]
      );
      const total = lessons.length;
      let completed = 0;
      if (total > 0) {
        const progressRows = await db.query<{ is_completed: boolean }>(
          `SELECT is_completed FROM lesson_progress
            WHERE user_id = $1 AND lesson_id = ANY($2)`,
          [userId, lessons.map((l) => l.id)]
        );
        completed = progressRows.filter((r) => r.is_completed).length;
      }
      const progress = Number(e.progress || 0);
      const progressPercent = Math.round(progress);
       out.push({
         id: e.id,
         course_id: courseId,
         course_title: e.course_title,
         course_slug: e.course_slug,
         course_image_url: (e.course_image_url as string | null) ?? null,
         course_category: e.course_category ?? null,
         level: e.level || "beginner",
         skill_level: e.skill_level || "beginner",
         learning_goal: (e.learning_goal as string | null) ?? null,
         enrolled_at: normalizeDt(e.enrolled_at as string | null),
         completed_at: normalizeDt(e.completed_at as string | null),
         progress,
         total_lessons: total,
         completed_lessons: completed,
         progress_percent: progressPercent,
         is_completed: progressPercent >= 100 || (total > 0 && completed === total),
       });
    }
    res.json(out);
  })
);

// PATCH /enrollments/:id/onboarding — save skill level + learning goal for an
// existing enrollment (called after the onboarding survey is completed).
router.patch(
  "/enrollments/:id/onboarding",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const enrollmentId = req.params.id;
    const body = validate(OnboardingUpdateSchema, req.body);
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (body.skill_level !== undefined) {
      fields.push(`skill_level = $${idx++}`);
      values.push(body.skill_level);
    }
    if (body.learning_goal !== undefined) {
      fields.push(`learning_goal = $${idx++}`);
      values.push(body.learning_goal);
    }
    if (fields.length === 0) {
      res.json(await enrollmentJson(enrollmentId));
      return;
    }
    // Verify the enrollment belongs to this user before updating.
    const ownership = await db.get<Row>(
      `SELECT 1 FROM enrollments WHERE id = $1 AND user_id = $2`,
      [enrollmentId, userId]
    );
    if (!ownership) throw notFound("Enrollment not found");
    await db.query(
      `UPDATE enrollments SET ${fields.join(", ")} WHERE id = $${idx}`,
      [...values, enrollmentId]
    );
    res.json(await enrollmentJson(enrollmentId));
  })
);

router.get(
  "/:course_id",
  wrap(async (req, res) => {
    const courseId = assertUuid(req.params.course_id);
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE id = $1`, [courseId]);
    if (!course) throw notFound("Course not found");
    res.json(await loadCourseTree(course));
  })
);

router.get(
  "/slug/:slug",
  wrap(async (req, res) => {
    const slug = req.params.slug;
    let course: CourseRow | null = null;
    try {
      course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [slug]);
    } catch {
      course = null;
    }
    if (!course) {
      const fb = fallbackCourseBySlug(slug);
      if (!fb) throw notFound("Course not found");
      const payload = fallbackCourseToResponse(fb);
      res.json(payload);
      return;
    }
    const payload = await loadCourseTree(course);
    await attachLessonProgress(req as AuthedRequest, payload as never);
    res.json(payload);
  })
);

function fallbackCourseToResponse(c: FallbackCourse): Record<string, unknown> {
  // Matches Pydantic's CourseResponse for the fallback dicts (progress null).
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    short_description: c.short_description,
    level: c.level,
    duration: c.duration,
    price: c.price,
    is_published: c.is_published,
    is_featured: c.is_featured,
    is_ai_generated: c.is_ai_generated,
    image_url: c.image_url ?? null,
    category_id: c.category_id,
    instructor_id: c.instructor_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
    category: c.category,
    modules: c.modules.map((m) => ({
      id: m.id,
      course_id: m.course_id,
      title: m.title,
      description: m.description,
      order: m.order,
      created_at: m.created_at,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        module_id: l.module_id,
        title: l.title,
        content: l.content,
        video_url: l.video_url,
        duration: l.duration,
        order: l.order,
        is_published: l.is_published,
        created_at: l.created_at,
        progress: null,
        is_completed: null,
      })),
    })),
  };
}

// --- admin-only write endpoints -------------------------------------------

router.post(
  "/",
  requireAdmin,
  wrap(async (req, res) => {
    const data = validate(CourseCreateSchema, req.body);
    const courseId = randomUUID();
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO courses
         (id, title, slug, description, short_description, level, duration, price,
          is_published, is_featured, is_ai_generated, image_url, category_id, instructor_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
      [
        courseId, data.title, data.slug, data.description ?? null,
        data.short_description ?? null, data.level, data.duration ?? null, data.price,
        data.is_published, data.is_featured, data.is_ai_generated,
        data.image_url ?? null, data.category_id ?? null, data.instructor_id ?? null, now,
      ]
    );
    for (const [mi, moduleData] of (data.modules ?? []).entries()) {
      const moduleId = randomUUID();
      const moduleOrder = moduleData.order || mi + 1;
      await db.query(
        `INSERT INTO modules (id, course_id, title, description, "order", created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [moduleId, courseId, moduleData.title, moduleData.description ?? null, moduleOrder, now]
      );
      for (const [li, lessonData] of (moduleData.lessons ?? []).entries()) {
        await db.query(
          `INSERT INTO lessons
             (id, module_id, title, content, video_url, duration, "order", is_published, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            randomUUID(), moduleId, lessonData.title, lessonData.content ?? null,
            lessonData.video_url ?? null, lessonData.duration ?? null,
            lessonData.order || li + 1, lessonData.is_published, now,
          ]
        );
      }
    }
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE id = $1`, [courseId]);
    if (!course) throw notFound("Course not found");
    res.status(201).json(await loadCourseTree(course));
  })
);

router.patch(
  "/:course_id",
  requireAdmin,
  wrap(async (req, res) => {
    const courseId = assertUuid(req.params.course_id);
    const data = validate(CourseUpdateSchema, req.body);
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE id = $1`, [courseId]);
    if (!course) throw notFound("Course not found");
    const sets: string[] = [];
    const params: unknown[] = [courseId];
    let i = 2;
    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        sets.push(`${field} = $${i++}`);
        params.push(value);
      }
    }
    if (sets.length) {
      sets.push(`updated_at = $${i++}`);
      params.push(new Date().toISOString());
      await db.query(`UPDATE courses SET ${sets.join(", ")} WHERE id = $1`, params);
    }
    const updated = await db.get<CourseRow>(`SELECT * FROM courses WHERE id = $1`, [courseId]);
    if (!updated) throw notFound("Course not found");
    res.json(await loadCourseTree(updated));
  })
);

router.delete(
  "/:course_id",
  requireAdmin,
  wrap(async (req, res) => {
    const courseId = assertUuid(req.params.course_id);
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE id = $1`, [courseId]);
    if (!course) throw notFound("Course not found");
    await db.query(`DELETE FROM courses WHERE id = $1`, [courseId]);
    res.status(204).end();
  })
);

// --- student actions ------------------------------------------------------

async function enrollmentJson(enrollmentId: string): Promise<Record<string, unknown>> {
  const row = await db.get<Row>(
    `SELECT id, user_id, course_id, enrolled_at, completed_at, progress, skill_level, learning_goal FROM enrollments WHERE id = $1`,
    [enrollmentId]
  );
  if (!row) throw notFound("Enrollment not found");
  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_id,
    enrolled_at: normalizeDt(row.enrolled_at as string | null),
    completed_at: normalizeDt(row.completed_at as string | null),
    progress: Number(row.progress || 0),
    skill_level: row.skill_level ?? "beginner",
    learning_goal: row.learning_goal ?? null,
  };
}

router.post(
  "/slug/:slug/restart",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [req.params.slug]);
    if (!course) throw notFound("Course not found");
    const enrollment = await db.get<Row>(
      `SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [userId, course.id]
    );
    if (!enrollment) throw notFound("You are not enrolled in this course");
    const lessonIds = await db.query<{ id: string }>(
      `SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = $1`,
      [course.id]
    );
    if (lessonIds.length) {
      await db.query(
        `DELETE FROM lesson_progress WHERE user_id = $1 AND lesson_id = ANY($2)`,
        [userId, lessonIds.map((l) => l.id)]
      );
    }
    await db.query(
      `UPDATE enrollments SET progress = 0, completed_at = NULL WHERE id = $1`,
      [enrollment.id]
    );
    res.json(await enrollmentJson(enrollment.id as string));
  })
);

router.post(
  "/slug/:slug/enroll",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = validate(EnrollSchema, req.body);
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [req.params.slug]);
    if (!course) throw notFound("Course not found");
    const existing = await db.get<Row>(
      `SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [userId, course.id]
    );
    if (existing) {
      res.status(201).json(await enrollmentJson(existing.id as string));
      return;
    }
    const id = randomUUID();
    await db.query(
      `INSERT INTO enrollments (id, user_id, course_id, enrolled_at, completed_at, progress, skill_level, learning_goal)
       VALUES ($1,$2,$3,$4,NULL,0,$5,$6)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [id, userId, course.id, new Date().toISOString(), data.skill_level ?? "beginner", data.learning_goal ?? null]
    );
    // The conflict path (race between two concurrent enrolls) leaves the
    // original row intact — fetch whichever one exists now.
    const final = await db.get<Row>(
      `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [userId, course.id]
    );
    res.status(201).json(await enrollmentJson(final ? (final.id as string) : id));
  })
);

router.get(
  "/slug/:slug/pdf",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [req.params.slug]);
    if (!course) throw notFound("Course not found");

    // Gate: must be enrolled AND at least 50% through the course (the
    // enrollment `progress` column is recomputed from lesson averages).
    const enrollment = await db.get<Row>(
      `SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [userId, course.id]
    );
    if (!enrollment) throw notFound("You are not enrolled in this course");
    const progress = Number(enrollment.progress || 0);
    if (progress < 50) {
      throw forbidden("Download the course PDF once you're at least 50% through it.");
    }

    const tree = await loadCourseTree(course);
    const modules = (tree.modules as Record<string, unknown>[]) ?? [];
    const pdf = await generateCoursePdf({
      title: course.title,
      slug: course.slug,
      description: course.description,
      short_description: course.short_description,
      level: course.level,
      duration: course.duration,
      generatedAt: new Date(),
      modules: modules.map((m) => ({
        title: String(m.title ?? ""),
        description: (m.description as string | null) ?? null,
        lessons: ((m.lessons as Record<string, unknown>[]) ?? []).map((l) => ({
          title: String(l.title ?? ""),
          duration: (l.duration as string | null) ?? null,
          content: (l.content as string | null) ?? null,
        })),
      })),
    });

    const filename = `${course.slug}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdf);
  })
);

router.get(
  "/slug/:slug/conversations",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [req.params.slug]);
    if (!course) throw notFound("Course not found");
    const convs = await db.query<Row>(
      `SELECT id, title, created_at, updated_at FROM conversations
        WHERE user_id = $1 AND course_id = $2
        ORDER BY updated_at DESC`,
      [userId, course.id]
    );
    if (!convs.length) {
      res.json([]);
      return;
    }
    const counts = await db.query<{ conversation_id: string; count: number }>(
      `SELECT conversation_id, COUNT(id)::int AS count FROM messages
        WHERE conversation_id = ANY($1)
        GROUP BY conversation_id`,
      [convs.map((c) => c.id)]
    );
    const countMap = new Map(counts.map((c) => [c.conversation_id, c.count]));
    res.json(
      convs.map((c) => ({
        id: c.id,
        title: (c.title as string | null) || "Untitled chat",
        created_at: normalizeDt(c.created_at as string | null),
        updated_at: normalizeDt(c.updated_at as string | null),
        message_count: countMap.get(c.id as string) || 0,
      }))
    );
  })
);

router.get(
  "/slug/:slug/conversation/:conversation_id",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const conversationId = assertUuid(req.params.conversation_id);
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [req.params.slug]);
    if (!course) throw notFound("Course not found");
    const conversation = await findOwnedConversation(userId, conversationId);
    if (!conversation) throw notFound("Conversation not found");
    const messages = await db.query<Row>(
      `SELECT id, conversation_id, role, content, created_at FROM messages
        WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversation.id]
    );
    res.json(
      messages.map((m) => ({
        id: m.id,
        conversation_id: m.conversation_id,
        role: m.role,
        content: m.content,
        created_at: normalizeDt(m.created_at as string | null),
      }))
    );
  })
);

router.delete(
  "/slug/:slug/conversation/:conversation_id",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const conversationId = assertUuid(req.params.conversation_id);
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [req.params.slug]);
    if (!course) throw notFound("Course not found");
    const conversation = await findOwnedConversation(userId, conversationId);
    if (!conversation) throw notFound("Conversation not found");
    await db.query(`DELETE FROM messages WHERE conversation_id = $1`, [conversation.id]);
    await db.query(`DELETE FROM conversations WHERE id = $1`, [conversation.id]);
    res.status(204).end();
  })
);

router.post(
  "/slug/:slug/ask",
  requireUser,
  wrap(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = validate(AskSchema, req.body);
    const course = await db.get<CourseRow>(`SELECT * FROM courses WHERE slug = $1`, [req.params.slug]);
    if (!course) throw notFound("Course not found");
    const result = await answerCourseQuestion(
      userId,
      course.id,
      course.title,
      data.question,
      data.conversation_id
    );
    res.json({ answer: result.answer, conversation_id: result.conversation.id });
  })
);