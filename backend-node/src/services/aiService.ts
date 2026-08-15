/**
 * Cora AI tutor — retrieval-augmented Q&A over the course's study notes.
 *
 * Mirrors backend/app/services/ai_service.py. Stage 1 ranks the course's
 * published lessons against the question by term overlap; stage 2 calls an
 * OpenAI-compatible /chat/completions endpoint with the best chunks pinned
 * into the system prompt. Without an API key it degrades to a canned reply.
 */
import { randomUUID } from "node:crypto";

import { config } from "../config.js";
import { db } from "../db.js";
import type { Row } from "../db.js";
import { nowIso } from "../serialize.js";

const LLM_TIMEOUT_SECONDS = 30;
const TOP_K_CHUNKS = 4;

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "do", "does", "did",
  "what", "which", "how", "why", "when", "where", "who", "can", "could",
  "i", "me", "my", "we", "you", "your", "it", "its", "this", "that",
  "about", "explain", "tell", "mean", "meant", "help", "please", "for", "to",
]);

const FALLBACK_REPLY =
  "Cora's AI tutor isn't connected yet — set the OPENAI_API_KEY on the " +
  "backend and this answer becomes a real, notes-grounded reply.";

export interface ConversationRow extends Row {
  id: string;
  user_id: string;
  title: string | null;
  course_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MessageRow extends Row {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string | null;
}

function buildSystemPrompt(courseTitle: string, context: [string, string][]): string {
  const sections = context.map(([title, content]) => `## ${title}\n${content}`);
  const contextBlock = sections.length ? sections.join("\n\n") : "(no course content available)";
  return (
    `You are Cora, the friendly study companion inside the Courser ` +
    `learning platform, helping with the course "${courseTitle}".\n\n` +
    `Answer the user's question using ONLY the course notes below. If the ` +
    `notes do not cover the question, say so plainly and suggest where in ` +
    `the course it is covered. Keep answers clear, warm, and under 200 ` +
    `words. Use short paragraphs and bullet points when helpful.\n\n` +
    `COURSE NOTES:\n${contextBlock}`
  );
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []);
}

function scoreChunk(questionTerms: Map<string, number>, title: string, content: string): number {
  const terms = new Map<string, number>();
  for (const t of tokenize(`${title} ${content}`)) terms.set(t, (terms.get(t) || 0) + 1);
  let score = 0;
  for (const [term, count] of questionTerms) score += (terms.get(term) || 0) * count;
  return score;
}

async function retrieveContext(
  courseId: string,
  question: string,
  topK = TOP_K_CHUNKS
): Promise<[string, string][]> {
  const rows = await db.query<{ title: string; content: string | null }>(
    `SELECT l.title, l.content
       FROM lessons l JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1 AND l.is_published = TRUE
      ORDER BY m.order, l.order`,
    [courseId]
  );
  if (!rows.length) return [];

  const questionTerms = new Map<string, number>();
  for (const t of tokenize(question)) {
    if (!STOPWORDS.has(t)) questionTerms.set(t, (questionTerms.get(t) || 0) + 1);
  }

  const chunks: [string, string][] = rows.map((r) => [
    r.title,
    r.content || "(this lesson has no written notes yet)",
  ]);
  return chunks
    .sort((a, b) => scoreChunk(questionTerms, b[0], b[1]) - scoreChunk(questionTerms, a[0], a[1]))
    .slice(0, topK);
}

async function generateAnswer(
  question: string,
  context: [string, string][],
  courseTitle: string
): Promise<string> {
  if (!config.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_SECONDS * 1000);
  try {
    const res = await fetch(`${config.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.OPENAI_MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(courseTitle, context) },
          { role: "user", content: question },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("empty LLM response");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function getOrCreateConversation(
  userId: string,
  courseId: string,
  courseTitle: string
): Promise<ConversationRow> {
  const existing = await db.get<ConversationRow>(
    `SELECT * FROM conversations WHERE user_id = $1 AND course_id = $2 ORDER BY updated_at DESC LIMIT 1`,
    [userId, courseId]
  );
  if (existing) return existing;
  const conv: ConversationRow = {
    id: randomUUID(),
    user_id: userId,
    course_id: courseId,
    title: courseTitle,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  await db.query(
    `INSERT INTO conversations (id, user_id, title, course_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$5)`,
    [conv.id, userId, courseTitle, courseId, nowIso()]
  );
  return conv;
}

async function appendMessage(conversationId: string, role: string, content: string): Promise<MessageRow> {
  const msg: MessageRow = {
    id: randomUUID(),
    conversation_id: conversationId,
    role,
    content,
    created_at: nowIso(),
  };
  await db.query(
    `INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES ($1,$2,$3,$4,$5)`,
    [msg.id, conversationId, role, content, nowIso()]
  );
  await db.query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [
    conversationId,
    nowIso(),
  ]);
  return msg;
}

async function createConversation(
  userId: string,
  courseId: string,
  courseTitle: string,
  firstQuestion: string
): Promise<ConversationRow> {
  const conv: ConversationRow = {
    id: randomUUID(),
    user_id: userId,
    course_id: courseId,
    title: firstQuestion.slice(0, 80),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  await db.query(
    `INSERT INTO conversations (id, user_id, title, course_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$5)`,
    [conv.id, userId, conv.title, courseId, nowIso()]
  );
  await appendMessage(conv.id, "user", firstQuestion);
  return conv;
}

async function findOwnedConversation(
  userId: string,
  conversationId: string
): Promise<ConversationRow | null> {
  return db.get<ConversationRow>(
    `SELECT * FROM conversations WHERE id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
}

export interface AskResult {
  answer: string;
  usedAi: boolean;
  conversation: ConversationRow;
}

export async function answerCourseQuestion(
  userId: string,
  courseId: string,
  courseTitle: string,
  question: string,
  conversationId?: string | null
): Promise<AskResult> {
  let conversation: ConversationRow;
  if (conversationId) {
    const found = await findOwnedConversation(userId, conversationId);
    if (!found) throw new Error("conversation not found or not owned by user");
    conversation = found;
    await appendMessage(conversation.id, "user", question);
  } else {
    conversation = await createConversation(userId, courseId, courseTitle, question);
  }

  const context = await retrieveContext(courseId, question);
  let answer: string;
  let usedAi: boolean;
  try {
    answer = await generateAnswer(question, context, courseTitle);
    usedAi = true;
  } catch {
    answer = FALLBACK_REPLY;
    usedAi = false;
  }
  await appendMessage(conversation.id, "assistant", answer);
  return { answer, usedAi, conversation };
}

export { findOwnedConversation };