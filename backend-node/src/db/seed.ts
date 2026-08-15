/**
 * Catalog seeder — Node port of backend/seed_courses.py.
 *
 * Idempotent by natural key; the actual upsert logic lives in
 * `src/db/writeCourse.ts` (shared with the Markdown course importer). Every
 * lesson gets its structured study notes from LESSON_NOTES.
 *
 * Usage: npm run seed
 */
import { pool } from "../db.js";
import { COURSES } from "../seed/courseSeedData.js";
import { upsertCourse } from "./writeCourse.js";

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const course of COURSES) await upsertCourse(client, course);
    await client.query("COMMIT");
    const lessonCount = COURSES.reduce((n, c) => n + c.modules.reduce((m, x) => m + x.lessons.length, 0), 0);
    console.log(`Seeded ${COURSES.length} courses (${lessonCount} lessons).`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});