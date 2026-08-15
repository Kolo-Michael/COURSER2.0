---
title: "Advanced CSS Layouts"
slug: advanced-css-layouts
description: "Take your CSS beyond the basics: master flexbox, grid, and responsive patterns that adapt to any screen, with practical exercises and a Try-it editor in every lesson."
short_description: "Master flexbox, grid, and responsive patterns."
level: intermediate
duration: "3 weeks"
category_slug: web-development
is_featured: false
image_url: "/course-covers/advanced-css-layouts.svg"
---

[MODULE: Layout foundations]
A quick refresher on the two layout engines that power modern CSS, then a hands-on comparison of when to reach for each.

[LESSON: The box model and flow | 10 min]
## Overview
Every element on a page is a rectangular box. How those boxes behave in the default layout flow determines a surprising amount of your layout problems.

## The parts of the box
- **Content** — the text or media inside the element.
- **Padding** — space between content and the border.
- **Border** — the visible edge.
- **Margin** — space that pushes *other* boxes away.

## Block vs inline flow
- **Block** elements (a paragraph, a div) stack vertically and fill their parent's width.
- **Inline** elements (a link, a span) sit on the same line and only take the width they need.

## Key takeaways
- Boxes: content → padding → border → margin, in that order.
- Changing `display` is the lever that moves an element between flow modes.
- `box-sizing: border-box` keeps declared widths honest by including padding and border.

[LESSON: Flexbox essentials | 12 min]
## Overview
Flexbox arranges items along a single axis and is the fastest way to align a row of cards, a toolbar, or a centered hero.

## The two ingredients
1. Put `display: flex` on the **container**.
2. Let the **items** flex with `flex-wrap`, `gap`, and alignment properties.

## A chip row that wraps

```html
<div class="meta-row">
  <span class="chip">Beginner</span>
  <span class="chip">4 weeks</span>
  <span class="chip">Free</span>
</div>
```

```css
.meta-row {
  display: flex;
  flex-wrap: wrap; /* chips drop to a new line when they run out of room */
  gap: 8px;
}
```

## Common mistakes
- Setting `justify-content` before adding `display: flex` — nothing happens.
- Forgetting `flex-wrap: wrap` on a narrow screen, so items overflow sideways.

## Key takeaways
- Flexbox is one-directional: pick the axis, align that axis.
- `gap` replaces the old margin-hacks for spacing.
- `flex-wrap: wrap` is the whole secret to responsive chip rows.

[LESSON: Grid for whole-page layout | 12 min]
## Overview
CSS Grid is the two-dimensional layout engine: it places items into rows **and** columns, which makes it ideal for whole-page layouts and card grids.

## Fluid cards that collapse

```html
<div class="course-grid">
  <div class="card">HTML</div>
  <div class="card">CSS</div>
  <div class="card">JavaScript</div>
  <div class="card">React</div>
</div>
```

```css
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
```

`auto-fit` + `minmax(200px, 1fr)` tells the browser "place as many ≥200px columns as fit, and let the leftovers grow" — the grid becomes fluid with zero media queries.

## Check your understanding
- Which single CSS property decides how many columns fit at a given width?
- What does `1fr` mean in a track list?
- When would you still reach for a media query instead of `auto-fit`?

## Key takeaways
- Grid = rows **and** columns; flexbox = one axis.
- `repeat(auto-fit, minmax(…))` gives responsive columns for free.
- Grid is for the page; flex is for the row.

[MODULE: Responsive patterns in practice]
Apply the two engines to real problems: navigation that collapses, a media-query fallback, and a full page that stays readable at any width.

[LESSON: A page layout that adapts | 15 min]
## Overview
Combine a page-level grid with a breakpoint so the same HTML reads well on a phone and a desktop.

## The pattern
- A single-column grid by default.
- A media query promoting the sidebar next to the main content on wider screens.

```css
.page {
  display: grid;
  gap: 16px;
}

@media (min-width: 768px) {
  .page {
    grid-template-columns: 220px 1fr; /* sidebar + content */
  }
}
```

## Key takeaways
- Mobile-first: build the single column first, then enhance.
- Media queries are still the right tool when the layout shape *changes*, not just resizes.

## Check your understanding
- Why does `auto-fit` alone not handle a sidebar-and-content split?
- What is the difference between `min-width` (mobile-first) and `max-width` (desktop-first) media queries?

[LESSON: Put it together — a card gallery | 18 min]
## Overview
Build a gallery that uses flex for the toolbar, grid for the cards, and one media query for the whole-page rhythm.

## Try it yourself
```html
<div class="toolbar">
  <span class="chip">All</span><span class="chip">Web</span><span class="chip">Data</span>
</div>
<div class="gallery">
  <div class="card"><h3>HTML</h3><p>Structure</p></div>
  <div class="card"><h3>CSS</h3><p>Style</p></div>
  <div class="card"><h3>JS</h3><p>Behavior</p></div>
  <div class="card"><h3>React</h3><p>Components</p></div>
</div>
```

```css
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; }
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.chip {
  border: 1px solid #e7e5e4; border-radius: 999px; padding: 4px 12px;
}
.card { border: 1px solid #e7e5e4; border-radius: 12px; padding: 12px; }
```

## Key takeaways
- Pick the engine per job: flex for rows, grid for grids.
- Combine them freely — a flex toolbar over a grid gallery is a real pattern.
- The Try-it editor above is the fastest way to verify your layout.