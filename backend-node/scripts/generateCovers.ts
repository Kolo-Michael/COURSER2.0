/**
 * Course cover generator — writes a self-hosted SVG "cover image" for every
 * seeded course into frontend/public/course-covers/<slug>.svg.
 *
 * The covers are deterministic SVG art (gradient + dots + title) so each
 * course has a distinct, matching image with no external assets or licenses.
 * The `image_url` column on courses points at these files.
 *
 * Usage: npm run gen:covers
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "..", "frontend", "public", "course-covers");

const ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESCAPE[c]);
}

function wrapLines(title: string, maxLen: number, maxLines: number): string[] {
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLen || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length > maxLines) lines[maxLines - 1] += " …";
  return lines.slice(0, maxLines);
}

function coverSvg(slug: string, course: { title: string; category: string; c1: string; c2: string }): string {
  const lines = wrapLines(course.title, 26, 2);
  const lineTspans = lines
    .map((line, i) => {
      const y = 185 + i * 52;
      return `<text x="320" y="${y}" text-anchor="middle" font-size="${lines.length === 2 ? 44 : 50}" font-weight="800" fill="#FFFFFF" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">${esc(line)}</text>`;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="${esc(course.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${course.c1}"/>
      <stop offset="1" stop-color="${course.c2}"/>
    </linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.6" fill="#FFFFFF" fill-opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <rect width="640" height="360" fill="url(#dots)"/>
  <circle cx="520" cy="60" r="150" fill="#FFFFFF" fill-opacity="0.08"/>
  <circle cx="90" cy="330" r="120" fill="#FFFFFF" fill-opacity="0.07"/>
  <text x="320" y="70" text-anchor="middle" font-size="15" font-weight="700" letter-spacing="4" fill="#FFFFFF" fill-opacity="0.75" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">COURSER</text>
  <rect x="56" y="100" width="130" height="30" rx="15" fill="#FFFFFF" fill-opacity="0.16"/>
  <text x="121" y="121" text-anchor="middle" font-size="13" font-weight="600" fill="#FFFFFF" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">${esc(course.category.toUpperCase())}</text>
  ${lineTspans}
  <rect x="56" y="300" width="118" height="30" rx="15" fill="#FFFFFF" fill-opacity="0.16"/>
  <text x="115" y="321" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">FREE COURSE</text>
  <text x="584" y="321" text-anchor="end" font-size="13" font-weight="600" fill="#FFFFFF" fill-opacity="0.85" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">COURSER 2.0</text>
</svg>
`;
}

// slug → (title, category label, gradient colors). Kept in one place so the
// covers stay in sync with the catalog seed + the markdown-imported courses.
const COVERS: Record<string, { title: string; category: string; c1: string; c2: string }> = {
  "frontend-foundations-react": { title: "Frontend Foundations with React", category: "Web Development", c1: "#1D4ED8", c2: "#60A5FA" },
  "python-data-analysis-starter": { title: "Python Data Analysis Starter", category: "Data Science", c1: "#0F766E", c2: "#2DD4BF" },
  "ai-prompting-course-creators": { title: "AI Prompting for Course Creators", category: "AI & ML", c1: "#6D28D9", c2: "#A78BFA" },
  "mobile-app-basics-react-native": { title: "Mobile App Basics with React Native", category: "Mobile Development", c1: "#4338CA", c2: "#818CF8" },
  "devops-launch-checklist": { title: "DevOps Launch Checklist", category: "DevOps", c1: "#334155", c2: "#94A3B8" },
  "product-design-learning-platforms": { title: "Product Design for Learning Platforms", category: "Product & Design", c1: "#B45309", c2: "#FBBF24" },
  "python-for-beginners": { title: "Python for Beginners", category: "Programming", c1: "#1E40AF", c2: "#38BDF8" },
  "javascript-essentials": { title: "JavaScript Essentials", category: "Programming", c1: "#A16207", c2: "#FACC15" },
  "java-programming-basics": { title: "Java Programming Basics", category: "Programming", c1: "#B91C1C", c2: "#F87171" },
  "html-css-from-scratch": { title: "HTML & CSS from Scratch", category: "Web Development", c1: "#C2410C", c2: "#FDBA74" },
  "sql-databases-for-beginners": { title: "SQL & Databases for Beginners", category: "Data Science", c1: "#0E7490", c2: "#22D3EE" },
  "git-version-control-basics": { title: "Git & Version Control Basics", category: "DevOps", c1: "#7C2D12", c2: "#F97316" },
  "advanced-css-layouts": { title: "Advanced CSS Layouts", category: "Web Development", c1: "#3730A3", c2: "#818CF8" },
};

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  for (const [slug, course] of Object.entries(COVERS)) {
    const svg = coverSvg(slug, course);
    await writeFile(join(OUT, `${slug}.svg`), svg, "utf8");
    console.log(`  ✓ ${slug}.svg`);
  }
  console.log(`Wrote ${Object.keys(COVERS).length} covers to ${OUT}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});