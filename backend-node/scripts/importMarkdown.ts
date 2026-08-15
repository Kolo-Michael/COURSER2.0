/**
 * Markdown course importer — add whole courses as markdown, not via seeding.
 *
 * Each `.md` file is one course. A YAML-ish front-matter block (between `---`
 * lines) carries the course metadata; `[MODULE: …]` and `[LESSON: …]` markers
 * build the tree, and everything inside a lesson is its study notes — the same
 * grammar the notes renderer displays (## headings, ### subheadings, `- `
 * bullets, ``` fenced code, **bold**, `code`), so headings/subheadings/body
 * are presented exactly as authored.
 *
 *   ---
 *   title: "Advanced CSS"
 *   slug: advanced-css
 *   description: "…"
 *   short_description: "…"
 *   level: intermediate
 *   duration: "4 weeks"
 *   category_slug: web-development
 *   is_featured: true
 *   ---
 *
 *   [MODULE: Layout mastery]
 *   Module description shown on the module nav.
 *
 *   [LESSON: Floats, flex, and grid | 12 min]
 *   ## Overview
 *   …
 *   [LESSON: Modern spacing | 10 min]
 *   ## Overview
 *   …
 *
 * Usage:
 *   npm run import:md                 # import every *.md in ./courses
 *   npm run import:md -- path/to.md   # import a single file
 *
 * Idempotent by slug (re-running updates the same course). Courses are always
 * created free + published, mirroring the catalog seeder.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { pool } from "../src/db.js";
import { upsertCourse } from "../src/db/writeCourse.js";
import type { SeedCourse, SeedLesson, SeedModule } from "../src/seed/courseSeedData.js";

// --- front-matter (minimal YAML subset) -----------------------------------

function parseFrontMatter(lines: string[]): { meta: Record<string, string>; rest: string[] } {
  const meta: Record<string, string> = {};
  let rest = lines;
  if (lines[0]?.trim() === "---") {
    const end = lines.slice(1).findIndex((l) => l.trim() === "---");
    if (end >= 0) {
      for (const line of lines.slice(1, 1 + end)) {
        const m = line.match(/^\s*([a-zA-Z_][\w]*)\s*:\s*(.*)$/);
        if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
      rest = lines.slice(2 + end);
    }
  }
  return { meta, rest };
}

// --- markers ---------------------------------------------------------------

const MODULE_RE = /^\[MODULE:\s*(.+?)\s*\]\s*$/;
const LESSON_RE = /^\[LESSON:\s*(.+?)\s*\]\s*$/;

function splitTitleDuration(label: string): { title: string; duration: string | null } {
  const parts = label.split("|").map((p) => p.trim());
  return { title: parts[0], duration: parts[1] ?? null };
}

// --- parsing ---------------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCourseMarkdown(text: string): SeedCourse {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const { meta, rest } = parseFrontMatter(lines);

  const modules: SeedModule[] = [];
  let currentModule: SeedModule | null = null;
  let currentLesson: SeedLesson | null = null;
  let currentLines: string[] = [];

  const flushLesson = () => {
    if (currentModule && currentLesson) {
      // Trim blank edges but keep internal structure (headings, subheadings…).
      const content = currentLines.join("\n").trim();
      currentLesson.content = content;
      currentModule.lessons.push(currentLesson);
      currentLesson = null;
      currentLines = [];
    }
  };

  const flushModule = () => {
    flushLesson();
    if (currentModule) modules.push(currentModule);
    currentModule = null;
  };

  for (const line of rest) {
    const moduleMatch = line.match(MODULE_RE);
    if (moduleMatch) {
      flushModule();
      currentModule = { title: moduleMatch[1].trim(), description: null, order: modules.length + 1, lessons: [] };
      continue;
    }
    const lessonMatch = line.match(LESSON_RE);
    if (lessonMatch) {
      flushLesson();
      const { title, duration } = splitTitleDuration(lessonMatch[1]);
      currentLesson = {
        title,
        content: "",
        duration,
        order: (currentModule?.lessons.length ?? 0) + 1,
        is_published: true,
      };
      continue;
    }
    if (currentLesson) {
      currentLines.push(line);
    } else if (currentModule) {
      // Pre-lesson lines become the module description (trimmed, joined).
      const desc = currentModule.description ? `${currentModule.description}\n${line}` : line;
      currentModule.description = desc;
    }
  }
  flushModule();

  if (!modules.length) {
    throw new Error("No [MODULE:] / [LESSON:] markers found — nothing to import.");
  }

  return {
    title: meta.title || "Untitled course",
    slug: meta.slug || slugify(meta.title || "untitled-course"),
    description: meta.description ?? "",
    short_description: meta.short_description ?? "",
    level: meta.level || "beginner",
    duration: meta.duration ?? null,
    is_featured: meta.is_featured === "true",
    is_ai_generated: meta.is_ai_generated === "true",
    image_url: meta.image_url ?? null,
    category_slug: meta.category_slug || "web-development",
    modules,
  };
}

// --- runner ----------------------------------------------------------------

async function collectFiles(target: string): Promise<string[]> {
  const info = await stat(target);
  if (info.isDirectory()) {
    return (await readdir(target)).filter((f) => f.endsWith(".md")).map((f) => join(target, f));
  }
  return [target];
}

async function main(): Promise<void> {
  const target = process.argv[2] ?? join(process.cwd(), "courses");
  const files = await collectFiles(target);
  if (!files.length) {
    console.log(`No .md files found at ${target}.`);
    return;
  }
  const client = await pool.connect();
  let imported = 0;
  try {
    await client.query("BEGIN");
    for (const file of files) {
      const text = await readFile(file, "utf8");
      const course = parseCourseMarkdown(text);
      const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
      await upsertCourse(client, course);
      imported += 1;
      console.log(`  ✓ ${course.slug} — "${course.title}" (${course.modules.length} modules, ${lessonCount} lessons)`);
    }
    await client.query("COMMIT");
    console.log(`Imported ${imported} course(s) from ${files.length} file(s).`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});