---
title: "HTML & CSS from Scratch"
slug: html-css-from-scratch
description: "Build a real webpage from an empty file: semantic structure, styling with CSS, and a responsive layout that works on any screen."
short_description: "Structure and style pages with semantic HTML and CSS."
level: beginner
duration: "3 weeks"
category_slug: web-development
image_url: /course-covers/html-css-from-scratch.svg
is_featured: false
---

[MODULE: Structure with HTML]
Write semantic markup that is readable by browsers, screen readers, and search engines.

[LESSON: Semantic page structure | 12 min]
## Overview
Semantic HTML means choosing tags for their *meaning*, not their appearance. Browsers, assistive technology, and search engines all rely on that meaning.

## The main landmarks
- `<header>` — the top banner (logo, nav).
- `<nav>` — the primary navigation links.
- `<main>` — the page's unique content.
- `<article>` — a self-contained piece of content.
- `<footer>` — the bottom of the page.

## A skeleton page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My page</title>
</head>
<body>
  <header><nav>…</nav></header>
  <main>
    <article>
      <h1>Welcome</h1>
      <p>A paragraph of real content.</p>
    </article>
  </main>
  <footer>…</footer>
</body>
</html>
```

## Key takeaways
- One `<h1>` per page, headings in order.
- Use `<ul>`/`<li>` for lists and `<a>` for links with descriptive text.
- Good structure is free accessibility.

[LESSON: Text, links, and images | 12 min]
## Overview
Most of the web is prose: headings, paragraphs, links, and images. Getting these right is 80% of writing good HTML.

## Elements you will use constantly
- `<h1>`–`<h6>` for headings, in order.
- `<p>` for paragraphs, `<strong>`/`<em>` for emphasis.
- `<a href="…">` for links — always with useful link text.
- `<img src="…" alt="…">` — the `alt` text matters for screen readers.

## Key takeaways
- Links need real destination text, never "click here".
- Images must have `alt` text describing what they show.
- Nest tags correctly: every `<p>` you open, you close.

[MODULE: Style with CSS]
Turn structured HTML into a designed page with colors, spacing, and responsive layouts.

[LESSON: Selectors, colors, and the box model | 14 min]
## Overview
CSS pairs with HTML: a stylesheet names elements and describes their look. Understanding the box model explains most layout mysteries.

## Connecting CSS
```html
<link rel="stylesheet" href="style.css">
```

## A small stylesheet

```css
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  background: #f7f6f4;
  color: #1c1917;
}
.card {
  padding: 16px;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
}
```

## The box model
- **content** → **padding** → **border** → **margin**, outside to inside.
- `box-sizing: border-box` keeps the declared width honest.

## Key takeaways
- Selectors: element (`p`), class (`.card`), id (`#app`).
- Specificity decides which rule wins; classes beat elements.
- Padding is inside the border, margin is outside.

[LESSON: Responsive layouts with flex and grid | 16 min]
## Overview
Responsive means the layout adapts to the viewport. Flexbox handles one dimension; Grid handles two.

## Flex for a row that wraps
```css
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
```

## Grid for a card gallery
```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
```

`auto-fit` + `minmax` lets the browser decide how many columns fit, so the grid collapses gracefully without media queries.

## Key takeaways
- Flex for rows/alignment, Grid for whole layouts.
- `gap` replaces margin hacks for spacing.
- `repeat(auto-fit, minmax(200px, 1fr))` is responsive out of the box.