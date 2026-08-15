// ─── tryItExamples.ts : runnable "Try it Yourself" demos ────────────────────
// Hand-crafted HTML documents keyed by lesson title. Lessons without a demo
// fall back to auto-assembling a document from the lesson's own fenced
// HTML/CSS/JS code blocks (see CourseWorkspacePanel). Keyed by the exact
// seeded lesson title so the demos stay tied to the content they teach.

export const LESSON_EXAMPLES: Record<string, string> = {
  // Demonstrates structure (HTML) + presentation (CSS) + behavior (JS).
  'How the web page is assembled': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #1c1917; }
    h1 { color: #ea580c; }
    .card { border: 1px solid #e7e5e4; border-radius: 12px; padding: 1rem 1.25rem; }
    button { background: #ea580c; color: #fff; border: 0; border-radius: 8px; padding: .5rem 1rem; font-size: 1rem; cursor: pointer; }
    #status { margin-top: .75rem; font-weight: 600; color: #334155; min-height: 1.5rem; }
  </style>
</head>
<body>
  <h1>Hello, COURSER</h1>
  <div class="card">
    <p>This is <strong>HTML</strong> (structure) styled with <strong>CSS</strong> (appearance).</p>
    <button onclick="sayHi()">Click me</button>
    <p id="status"></p>
  </div>
  <script>
    function sayHi() {
      document.getElementById('status').textContent = 'JavaScript ran — the button was clicked.';
    }
  </script>
</body>
</html>`,

  // Demonstrates flex-wrap + a fluid grid + a media query, w3schools style.
  'Responsive layout with flex and grid': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; color: #1c1917; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.5rem; }
    .chip { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 999px; padding: 4px 12px; font-size: 13px; }
    .course-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .card { border: 1px solid #e7e5e4; border-radius: 12px; padding: 1rem; }
    .card h3 { margin: 0 0 .5rem; color: #ea580c; }
    .tip { margin-top: 1.25rem; font-size: 14px; color: #57534e; }
    @media (max-width: 520px) { .tip { color: #ea580c; font-weight: 600; } }
  </style>
</head>
<body>
  <h1>Responsive cards</h1>
  <div class="meta-row">
    <span class="chip">Beginner</span>
    <span class="chip">4 weeks</span>
    <span class="chip">Free</span>
  </div>
  <div class="course-grid">
    <div class="card"><h3>HTML</h3><p>Structure</p></div>
    <div class="card"><h3>CSS</h3><p>Style</p></div>
    <div class="card"><h3>JavaScript</h3><p>Behavior</p></div>
    <div class="card"><h3>React</h3><p>Components</p></div>
  </div>
  <p class="tip">Resize the output window — the chip row wraps and the grid collapses to one column.</p>
</body>
</html>`,
}