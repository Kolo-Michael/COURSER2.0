/**
 * Content importer — pulls CC-licensed articles into `lesson_resources` so
 * learners can read the best external sources *in-app* (with attribution),
 * instead of only linking out.
 *
 * Sources must be server-rendered HTML (Wikipedia, MDN, 12factor, docs sites);
 * client-rendered SPAs (freeCodeCamp, react.dev, reactnative.dev) return an
 * empty shell and are therefore only used as curated links, never imported.
 *
 * Idempotent: re-running updates rows in place (keyed on lesson title + url).
 * A failed fetch is logged and skipped — the pipeline never hard-fails on a
 * single source, so you can rerun after transient network problems.
 *
 * Usage: npm run import:content
 */
import { randomUUID } from "node:crypto";

import { pool } from "../src/db.js";

interface ImportSource {
  source: string;
  license: string;
  url: string;
}

/** Manifest: lesson title → CC-licensed sources to import for that lesson. */
const MANIFEST: Record<string, ImportSource[]> = {
  "How the web page is assembled": [
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/HTML" },
    {
      source: "MDN Web Docs",
      license: "CC-BY-SA 4.0",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    },
  ],
  "Responsive layout with flex and grid": [
    {
      source: "MDN Web Docs",
      license: "CC-BY-SA 4.0",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox",
    },
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/CSS_grid_layout" },
  ],
  "Variables, lists, and dictionaries": [
    { source: "Python docs", license: "PSF", url: "https://docs.python.org/3/tutorial/introduction.html" },
    { source: "Python docs", license: "PSF", url: "https://docs.python.org/3/tutorial/datastructures.html" },
  ],
  "Cleaning a messy table": [
    {
      source: "pandas docs",
      license: "BSD-3-Clause",
      url: "https://pandas.pydata.org/docs/user_guide/missing_data.html",
    },
  ],
  "Group, summarize, and compare": [
    { source: "pandas docs", license: "BSD-3-Clause", url: "https://pandas.pydata.org/docs/user_guide/groupby.html" },
  ],
  "Build a simple chart": [
    {
      source: "Matplotlib docs",
      license: "BSD-3-Clause",
      url: "https://matplotlib.org/stable/tutorials/pyplot.html",
    },
  ],
  "Define learner level and outcome": [
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/Prompt_engineering" },
  ],
  "Check accuracy and tone": [
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/Plain_language" },
  ],
  "Create Cora-style hints": [
    {
      source: "Wikipedia",
      license: "CC-BY-SA 4.0",
      url: "https://en.wikipedia.org/wiki/Instructional_scaffolding",
    },
  ],
  "Native components and layout": [
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/React_Native" },
  ],
  "Environment variables and secrets": [
    { source: "12 Factor", license: "CC-BY 4.0", url: "https://12factor.net/config" },
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/Environment_variable" },
  ],
  "Build and health checks": [
    {
      source: "Wikipedia",
      license: "CC-BY-SA 4.0",
      url: "https://en.wikipedia.org/wiki/Continuous_delivery",
    },
  ],
  "Catalog decisions": [
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/User_experience_design" },
  ],
  "Mascot support patterns": [
    { source: "Wikipedia", license: "CC-BY-SA 4.0", url: "https://en.wikipedia.org/wiki/Chatbot" },
  ],
};

/** Strip HTML to readable text: drop interactive/structural blocks first. */
function extractReadable(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  // Turn block/heading/list boundaries into newlines.
  text = text.replace(/<\/(p|h1|h2|h3|h4|h5|li|tr|pre|blockquote|dt|dd)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "\n- ");
  text = text.replace(/<[^>]+>/g, " ");
  // Decode the common entities.
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
  text = text.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
  // Cap so course payloads stay reasonable (cut at a word boundary).
  const MAX = 6000;
  if (text.length > MAX) {
    const cut = text.slice(0, MAX);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : MAX)}…`;
  }
  return text;
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CourserContentBot/1.0 (educational import)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const body = extractReadable(html);
    if (body.length < 80) throw new Error("extracted body too short (likely a client-rendered SPA)");
    return body;
  } finally {
    clearTimeout(timer);
  }
}

interface Row {
  [key: string]: unknown;
}

async function main(): Promise<void> {
  const client = await pool.connect();
  let imported = 0;
  let skipped = 0;
  const failures: string[] = [];
  try {
    await client.query("BEGIN");
    for (const [lessonTitle, sources] of Object.entries(MANIFEST)) {
      const lesson = await client.query<Row>(`SELECT id FROM lessons WHERE title = $1 LIMIT 1`, [
        lessonTitle,
      ]);
      if (!lesson.rows[0]) {
        skipped += sources.length;
        failures.push(`${lessonTitle}: no lesson row found`);
        continue;
      }
      const lessonId = lesson.rows[0].id as string;
      for (const src of sources) {
        try {
          const body = await fetchText(src.url);
          // Savepoint so a single bad write can't poison the whole txn.
          await client.query("SAVEPOINT content_import");
          try {
            const existing = await client.query<Row>(
              `SELECT id FROM lesson_resources WHERE lesson_id = $1 AND url = $2`,
              [lessonId, src.url]
            );
            if (existing.rows[0]) {
              await client.query(
                `UPDATE lesson_resources SET source = $2, title = $3, license = $4, body = $5, fetched_at = now()
                  WHERE id = $1`,
                [existing.rows[0].id, src.source, src.url, src.license, body]
              );
            } else {
              await client.query(
                `INSERT INTO lesson_resources (id, lesson_id, source, title, url, license, body, fetched_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,now())`,
                [randomUUID(), lessonId, src.source, src.url, src.url, src.license, body]
              );
            }
            await client.query("RELEASE SAVEPOINT content_import");
          } catch (err) {
            await client.query("ROLLBACK TO SAVEPOINT content_import");
            throw err;
          }
          imported += 1;
          console.log(`  ✓ ${src.source}: ${src.url}`);
        } catch (err) {
          skipped += 1;
          const msg = err instanceof Error ? err.message : String(err);
          failures.push(`${src.url}: ${msg}`);
          console.log(`  ✗ ${src.source}: ${src.url} → ${msg}`);
        }
      }
    }
    await client.query("COMMIT");
    console.log(`Imported ${imported} source(s), skipped ${skipped}.`);
    if (failures.length) {
      console.log("Failures (rerun to retry):");
      for (const f of failures) console.log(`  - ${f}`);
    }
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