/**
 * Course-tree writer — shared upsert logic used by both the catalog seeder
 * (`src/db/seed.ts`) and the Markdown course importer
 * (`scripts/importMarkdown.ts`).
 *
 * Idempotent by natural key: categories keyed on slug, courses on slug,
 * modules on (course, order), lessons on (module, order). Existing rows are
 * UPDATED in place, missing ones INSERTED, so re-running converges to the
 * supplied content. Courses are always forced to price 0 + published.
 */
import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";

import { CATEGORIES, LESSON_QUIZZES } from "../seed/courseSeedData.js";
import type { SeedCourse } from "../seed/courseSeedData.js";

interface Row {
  [key: string]: unknown;
}

async function q<R extends Row>(client: PoolClient, text: string, params: unknown[] = []): Promise<R[]> {
  const res = await client.query(text, params);
  return res.rows as R[];
}

async function upsertCategory(client: PoolClient, slug: string): Promise<string> {
  const data = CATEGORIES.find((c) => c.slug === slug);
  if (!data) throw new Error(`Unknown category slug: ${slug}`);
  const existing = await q<Row>(client, `SELECT id FROM categories WHERE slug = $1`, [slug]);
  if (existing[0]) {
    await q(client, `UPDATE categories SET name = $2, icon = $3 WHERE slug = $1`, [slug, data.name, data.icon]);
    return existing[0].id as string;
  }
  const res = await q<Row>(client, `INSERT INTO categories (id, name, slug, icon) VALUES ($1, $2, $3, $4) RETURNING id`, [
    randomUUID(),
    data.name,
    data.slug,
    data.icon,
  ]);
  return res[0].id as string;
}

async function upsertLesson(client: PoolClient, moduleId: string, lesson: SeedCourse["modules"][number]["lessons"][number]): Promise<void> {
  const resources = lesson.resources ? JSON.stringify(lesson.resources) : null;
  // Every lesson ships a per-lesson self-check quiz (keyed by title in
  // LESSON_QUIZZES) so learners can verify understanding after each lesson.
  const quiz = lesson.quiz ? JSON.stringify(lesson.quiz) : LESSON_QUIZZES[lesson.title] ? JSON.stringify(LESSON_QUIZZES[lesson.title]) : null;
  const existing = await q<Row>(client, `SELECT id FROM lessons WHERE module_id = $1 AND "order" = $2`, [
    moduleId,
    lesson.order,
  ]);
  if (existing[0]) {
    await q(
      client,
      `UPDATE lessons SET title = $2, content = $3, duration = $4, is_published = $5, resource_links = $6, quiz = $7 WHERE id = $1`,
      [existing[0].id, lesson.title, lesson.content, lesson.duration, lesson.is_published, resources, quiz]
    );
  } else {
    await q(
      client,
      `INSERT INTO lessons (id, module_id, title, content, duration, "order", is_published, resource_links, quiz)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [randomUUID(), moduleId, lesson.title, lesson.content, lesson.duration, lesson.order, lesson.is_published, resources, quiz]
    );
  }
}

async function upsertModule(client: PoolClient, courseId: string, module: SeedCourse["modules"][number]): Promise<string> {
  const existing = await q<Row>(client, `SELECT id FROM modules WHERE course_id = $1 AND "order" = $2`, [
    courseId,
    module.order,
  ]);
  const quiz = module.quiz ? JSON.stringify(module.quiz) : null;
  let moduleId: string;
  if (existing[0]) {
    moduleId = existing[0].id as string;
    await q(client, `UPDATE modules SET title = $2, description = $3, quiz = $4 WHERE id = $1`, [
      moduleId,
      module.title,
      module.description,
      quiz,
    ]);
  } else {
    const res = await q<Row>(
      client,
      `INSERT INTO modules (id, course_id, title, description, "order", quiz) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [randomUUID(), courseId, module.title, module.description, module.order, quiz]
    );
    moduleId = res[0].id as string;
  }
  for (const lesson of module.lessons) await upsertLesson(client, moduleId, lesson);
  return moduleId;
}

/** Upsert one whole course (category → course → modules → lessons). */
export async function upsertCourse(client: PoolClient, course: SeedCourse): Promise<void> {
  const categoryId = await upsertCategory(client, course.category_slug);
  const existing = await q<Row>(client, `SELECT id FROM courses WHERE slug = $1`, [course.slug]);
  let courseId: string;
  if (existing[0]) {
    courseId = existing[0].id as string;
    await q(
      client,
      `UPDATE courses SET title = $2, description = $3, short_description = $4, level = $5,
              duration = $6, is_featured = $7, is_ai_generated = $8, image_url = $9, category_id = $10,
              price = 0, is_published = true, updated_at = now()
       WHERE id = $1`,
      [
        courseId, course.title, course.description, course.short_description, course.level,
        course.duration, course.is_featured, course.is_ai_generated, course.image_url ?? null, categoryId,
      ]
    );
  } else {
    const res = await q<Row>(
      client,
      `INSERT INTO courses (id, title, slug, description, short_description, level, duration, price,
         is_published, is_featured, is_ai_generated, image_url, category_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, true, $8, $9, $10, $11, now(), now()) RETURNING id`,
      [
        randomUUID(), course.title, course.slug, course.description, course.short_description, course.level,
        course.duration, course.is_featured, course.is_ai_generated, course.image_url ?? null, categoryId,
      ]
    );
    courseId = res[0].id as string;
  }
  for (const module of course.modules) await upsertModule(client, courseId, module);
}