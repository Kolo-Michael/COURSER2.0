---
title: "Python for Beginners"
slug: python-for-beginners
description: "Learn Python from zero: variables, conditionals, loops, functions, and file handling — the building blocks behind data, web, and AI work."
short_description: "Your first steps in the world's friendliest programming language."
level: beginner
duration: "4 weeks"
category_slug: programming-languages
image_url: /course-covers/python-for-beginners.svg
is_featured: false
---

[MODULE: Getting started with Python]
Install Python, run your first program, and get comfortable with the core data types every Python script builds on.

[LESSON: Running your first Python program | 10 min]
## Overview
Python is designed to read almost like English, which makes it the most common first programming language. Before worrying about syntax details, get one program running end to end.

## Install and verify
- Download Python from the official site and check the box that adds it to your PATH.
- Open a terminal and run `python --version` — you should see a version like `3.12.x`.
- Run the interactive shell with `python`, or run a file with `python hello.py`.

## Your first program

```python
print("Hello, COURSER!")
```

Save it as `hello.py` and run it. If you see `Hello, COURSER!` printed, the whole toolchain works.

## Key takeaways
- A Python file is just text; `python file.py` runs it.
- `print()` is how a program talks back to you.
- Get one working program first, then learn the details.

[LESSON: Variables, strings, and numbers | 12 min]
## Overview
Variables let you name values so programs can remember and change them. Python figures out types for you — you never declare one.

## Naming and assignment
- Names start with a letter or underscore, then letters, digits, or underscores.
- `=` assigns: `age = 25` stores the number, `name = "Ada"` stores the string.
- Use `snake_case` for most variables.

## Core types

```python
age = 25          # int
height = 1.75     # float
name = "Ada"      # str
is_student = True # bool
```

## Strings do more than you think
- `f"{name} is {age}"` — f-strings interpolate values cleanly.
- `.upper()`, `.strip()`, `.split(",")` are everyday string helpers.
- `len(name)` counts characters.

## Check your understanding
- What type does `"42"` hold, and how is it different from `42`?
- Which f-string prints `Ada is 25`?

## Key takeaways
- Variables are names for values; Python infers the type.
- `int`, `float`, `str`, and `bool` are the four types you reach for daily.
- f-strings are the idiomatic way to build text from values.

[MODULE: Making decisions and repeating work]
Programs get useful when they can branch and loop. These two lessons teach the `if` statement and `for` loops that power real scripts.

[LESSON: Conditionals with if and else | 12 min]
## Overview
Conditionals let your program make a decision based on data — the difference between a script that always does the same thing and one that reacts.

## The if statement

```python
score = 78
if score >= 70:
    print("Passed!")
else:
    print("Try again.")
```

Note the colon after the condition and the indented block — Python uses indentation instead of curly braces.

## Chaining with elif
- `if` for the first check, `elif` for middle checks, `else` for the fallback.
- Comparisons: `==`, `!=`, `<`, `<=`, `>`, `>=`.
- Combine conditions with `and` / `or` / `not`.

## Key takeaways
- Indentation defines blocks in Python — be consistent.
- `elif` chains read top to bottom; the first true branch wins.
- Booleans from comparisons drive every branch.

[LESSON: Loops with for and while | 14 min]
## Overview
Loops repeat work without you copying code. `for` is the workhorse for iterating over a collection; `while` repeats until a condition flips.

## For loops

```python
courses = ["HTML", "CSS", "Python"]
for course in courses:
    print("Learning", course)
```

## Counting with range
`range(3)` produces 0, 1, 2. Use it when you need an index: `for i in range(len(courses))`.

## While loops
```python
attempts = 0
while attempts < 3:
    attempts += 1
    print("Attempt", attempts)
```

## Key takeaways
- `for x in items` is the idiomatic way to walk a list.
- `range(n)` gives you numbers 0..n-1 for counting.
- `while` runs while a condition stays true — guard it against infinite loops.