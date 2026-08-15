---
title: "Java Programming Basics"
slug: java-programming-basics
description: "A typed, professional introduction to Java: classes, methods, control flow, and arrays — the foundation for Android, Spring, and enterprise careers."
short_description: "Structured, typed programming with Java."
level: beginner
duration: "5 weeks"
category_slug: programming-languages
image_url: /course-covers/java-programming-basics.svg
is_featured: false
---

[MODULE: Your first Java program]
Set up the Java toolchain and write a typed program from scratch.

[LESSON: Setting up and your first class | 12 min]
## Overview
Java compiles to bytecode and runs on the JVM, which makes it portable and heavily typed. The first program teaches the container every Java program needs: the class.

## Install the tools
- Install a JDK (version 17+ recommended).
- Verify with `java -version` and `javac -version`.
- Compile with `javac Hello.java`, run with `java Hello`.

## Hello world in Java

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, COURSER!");
    }
}
```

- The file name must match the class name (`Hello.java`).
- `main` is the entry point the JVM calls.

## Key takeaways
- Java is compiled first, then run — catch type errors before execution.
- Every program lives inside a class.
- `System.out.println` is Java's `print`.

[LESSON: Variables and typed data | 14 min]
## Overview
Java declares types up front. That discipline catches whole classes of bugs at compile time.

## Declaring values
```java
int age = 25;
double height = 1.75;
String name = "Ada";
boolean isStudent = true;
```

- Primitive types (`int`, `double`, `boolean`) hold raw values.
- `String` is a class — it behaves like a value in daily use.
- Use `final` for constants: `final int MAX_ATTEMPTS = 3;`.

## String helpers
- `name.length()`, `name.toUpperCase()`, `name.substring(0, 3)`.
- `String.format("Hi %s, you are %d", name, age)` builds text.

## Key takeaways
- Types are mandatory and checked at compile time.
- `int`/`double`/`boolean`/`String` cover most needs.
- `final` makes a value immutable — prefer it by default.

[MODULE: Decisions, loops, and collections]
Add control flow and arrays, then combine them into a working program.

[LESSON: If, loops, and arrays | 14 min]
## Overview
Control flow in Java looks familiar if you know C-style syntax; the difference is that arrays know their length.

## Conditionals and loops

```java
int score = 78;
if (score >= 70) {
    System.out.println("Passed");
} else {
    System.out.println("Try again");
}

for (int i = 0; i < 3; i++) {
    System.out.println("Attempt " + i);
}
```

## Arrays
```java
String[] courses = {"HTML", "CSS", "Java"};
for (String course : courses) {
    System.out.println("Learning " + course);
}
```

- The enhanced `for` (for-each) walks the whole array cleanly.
- `courses.length` — note: no parentheses, it is a field not a method.

## Key takeaways
- `if`/`else` and `for` use the same braces as other C-style languages.
- For-each loops are the idiomatic way to read every element.
- Arrays have a fixed size — use `ArrayList` when you need to grow.

[LESSON: Methods — reusable behavior | 12 min]
## Overview
Methods are Java's functions: named, typed blocks you call from other code.

## Defining and calling

```java
static int add(int a, int b) {
    return a + b;
}

public static void main(String[] args) {
    int total = add(2, 3);
    System.out.println(total);
}
```

- `static` means the method belongs to the class, not an instance.
- The signature declares return type, name, and parameter types.
- Methods without a return value use `void`.

## Key takeaways
- A method signature tells you exactly what it accepts and returns.
- Keep methods short and named after what they do.
- `main` is just a method the JVM calls to start your program.