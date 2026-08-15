/**
 * Public/edge tests — no database writes.
 *
 * These cover the API contract pieces that must behave identically to the
 * Python backend without mutating real data: health/ping shapes, security
 * headers, unauthenticated 401s, validation 422s, and the 0-byte keepalive.
 */
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "./app.js";

describe("public endpoints", () => {
  it("GET / returns the gateway envelope", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "COURSER API" });
  });

  it("GET /api/health returns { status: healthy }", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "healthy" });
  });

  it("GET /api/ping returns an empty 200 (keepalive contract)", async () => {
    const res = await request(app).get("/api/ping");
    expect(res.status).toBe(200);
    expect(res.text).toBe("");
  });

  it("GET /api/ lists the catalog (DB or fallback, always an array)", async () => {
    const res = await request(app).get("/api/courses");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length) {
      const first = res.body[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("slug");
    }
  });

  it("GET /api/courses/categories returns an array", async () => {
    const res = await request(app).get("/api/courses/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/courses/slug/{missing} returns 404 Course not found", async () => {
    const res = await request(app).get("/api/courses/slug/definitely-not-a-course");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Course not found" });
  });
});

describe("security headers", () => {
  it("stamps CSP / HSTS / X-Frame-Options / nosniff on responses", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(res.headers["strict-transport-security"]).toContain("max-age=31536000");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("auth edge cases (no DB writes)", () => {
  it("GET /api/auth/me without credentials -> 401 Not authenticated", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ detail: "Not authenticated" });
  });

  it("POST /api/auth/login with a bad password -> 401 Invalid email or password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "student@courser.com", password: "definitely-wrong" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ detail: "Invalid email or password." });
  });

  it("POST /api/auth/login with a malformed email -> 422", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "x" });
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  it("GET /api/streak without credentials -> 401", async () => {
    const res = await request(app).get("/api/streak");
    expect(res.status).toBe(401);
  });

  it("POST /api/newsletter/subscribe with a valid email -> ok", async () => {
    const res = await request(app)
      .post("/api/newsletter/subscribe")
      .send({ email: "reader@example.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, message: "Subscribed." });
  });
});

// Silence the "pool error" handler from logging during the test run.
beforeAll(() => {
  process.env.VITEST = "1";
});

afterAll(() => {
  // Vitest will exit; nothing to tear down for these stateless checks.
});