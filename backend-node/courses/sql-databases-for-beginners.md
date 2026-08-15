---
title: "SQL & Databases for Beginners"
slug: sql-databases-for-beginners
description: "Design simple relational databases and answer real questions with SQL: SELECT, filters, joins, and aggregation."
short_description: "Ask questions of data with plain SQL."
level: beginner
duration: "4 weeks"
category_slug: data-science
image_url: /course-covers/sql-databases-for-beginners.svg
is_featured: false
---

[MODULE: Relational thinking]
Understand what a relational database is before you write any SQL.

[LESSON: Tables, rows, and keys | 12 min]
## Overview
A relational database stores data in tables — think spreadsheets with rules. Understanding tables, rows, and primary keys is the whole mental model.

## The model
- A **table** is a collection of **rows** (records).
- Every row has the same **columns** (fields).
- A **primary key** uniquely identifies a row.
- A **foreign key** points from one table to another's primary key.

## A simple table
| user_id (PK) | username | email            |
|--------------|----------|------------------|
| 1            | ada      | ada@courser.com  |
| 2            | linus    | linus@courser.com|

## Key takeaways
- Keys are how tables relate to each other.
- Primary keys never change and never repeat.
- A foreign key stores the primary key of a related row.

[LESSON: Selecting data with SELECT | 14 min]
## Overview
`SELECT` is the SQL word for "give me data". Learning it well covers most everyday queries.

## The basics

```sql
SELECT username, email FROM users;
SELECT * FROM users WHERE is_active = true;
SELECT * FROM courses ORDER BY created_at DESC LIMIT 5;
```

- `WHERE` filters rows before they come back.
- `ORDER BY` sorts; `LIMIT` caps how many rows you get.
- `*` means "every column" — prefer listing columns in code.

## Key takeaways
- Write `SELECT column FROM table` and add clauses as needed.
- `WHERE`, `ORDER BY`, `LIMIT` are the three clauses you will use daily.
- Filter with `=`, `<>`, `>`, `<`, `LIKE`, `IN`.

[MODULE: Joining and summarizing]
Combine tables and roll data up into answers.

[LESSON: Joins that make sense | 16 min]
## Overview
Joins combine rows from two tables using a key. `INNER JOIN` is the one you will use most.

## Joining courses to categories

```sql
SELECT c.title, cat.name
FROM courses c
JOIN categories cat ON cat.id = c.category_id
ORDER BY c.title;
```

- `c` and `cat` are aliases that shorten the query.
- `ON` states how rows match (foreign key = primary key).

## Join types in one line
- `INNER JOIN` — matching rows only (the default join).
- `LEFT JOIN` — all rows from the left table, even without matches.

## Key takeaways
- Always join on a key you own (`ON a.id = b.a_id`).
- `INNER JOIN` is the safe default; reach for `LEFT JOIN` to keep unmatched rows.
- Aliases keep joins readable.

[LESSON: Grouping and counting | 14 min]
## Overview
Aggregation turns many rows into a summary — counts, sums, and averages per group.

## Count lessons per course

```sql
SELECT course_id, COUNT(*) AS lesson_count
FROM lessons
GROUP BY course_id
ORDER BY lesson_count DESC;
```

- `COUNT(*)` counts rows; `SUM`, `AVG`, `MIN`, `MAX` do the arithmetic.
- `GROUP BY` buckets rows; `HAVING` filters buckets (like WHERE for groups).

## Key takeaways
- `GROUP BY column` + an aggregate answers "how many per …".
- `HAVING` filters grouped results; `WHERE` filters raw rows first.
- `AS` names the computed column for the reader.