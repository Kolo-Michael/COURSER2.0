---
title: "JavaScript Essentials"
slug: javascript-essentials
description: "Core JavaScript for the web: values, functions, the DOM, and events — everything you need before a framework enters the picture."
short_description: "The language of the web, from basics to events."
level: beginner
duration: "4 weeks"
category_slug: programming-languages
image_url: /course-covers/javascript-essentials.svg
is_featured: false
---

[MODULE: JavaScript fundamentals]
Start with values and functions — the pieces every script is made of.

[LESSON: Values, variables, and types | 12 min]
## Overview
JavaScript runs in every browser, so it is the one language you never need to install. Like Python, it infers types, but a few of its quirks (like `let` vs `const`) are worth learning early.

## Declaring variables
- `const` — cannot be reassigned (use by default).
- `let` — can be reassigned.
- Avoid `var`; it is old and behaves unexpectedly.

## The main types
- `number`, `string`, `boolean`, `null`, `undefined`.
- Objects and arrays hold collections.

```js
const title = "Courser";
let lessons = 42;
lessons = 43;      // let allows reassignment
const isFree = true;
```

## Key takeaways
- Default to `const`, switch to `let` when a value changes.
- `undefined` means "not assigned yet"; `null` means "explicitly empty".
- Template literals (backticks) interpolate: `` `${title} has ${lessons} lessons` ``.

[LESSON: Functions and arrow functions | 12 min]
## Overview
Functions are reusable blocks of behavior — the primary way to structure a script.

## Two ways to write one

```js
function add(a, b) {
  return a + b;
}

const addArrow = (a, b) => a + b;
```

- Function declarations are hoisted; `const` arrow functions are not.
- `return` hands a value back; without it a function returns `undefined`.

## Key takeaways
- Arrow functions are the modern default for callbacks and small helpers.
- Give functions names that say what they return (`getTotal`, `formatName`).
- Keep functions small — one job each.

[MODULE: Talking to the page]
JavaScript's real superpower is changing the document. Learn the DOM and events to make pages respond.

[LESSON: The DOM and selecting elements | 14 min]
## Overview
The Document Object Model is the browser's live tree of the page. JavaScript reads and edits that tree to change what users see.

## Grabbing elements
- `document.querySelector(".card")` — first match for a CSS selector.
- `document.querySelectorAll("li")` — every match, as a list.
- `document.getElementById("app")` — fast lookup by id.

```js
const card = document.querySelector(".card");
card.textContent = "Updated!";
```

## Key takeaways
- `querySelector` accepts any CSS selector, so you reuse CSS knowledge.
- `textContent` is the safe way to change text.
- The DOM re-renders automatically when you change it — no refresh needed.

[LESSON: Events and interactivity | 14 min]
## Overview
Events are the bridge between the user and your code: clicks, typing, and scrolling all fire events you can listen for.

## Adding a click listener

```js
const button = document.querySelector("#save");
button.addEventListener("click", () => {
  console.log("Saved!");
});
```

## What else you can listen for
- `input` on text fields fires on every keystroke.
- `submit` on forms runs before the page reloads (use `preventDefault()`).
- `keydown` handles keyboard shortcuts.

## Key takeaways
- `addEventListener` keeps behavior separate from HTML.
- Callbacks run later — they capture the variables they close over.
- Always call `event.preventDefault()` on form submits you handle.