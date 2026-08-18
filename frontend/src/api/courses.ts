// ─── courses.ts : catalog, enrollment & lesson progress API ─────────────
// Typed helpers for the course catalog, categories, user enrollments,
// per-lesson progress, the Cora tutor ask endpoint, and newsletter signup.
import { apiRequest } from './client'

/** Category a course belongs to (optional on courses). */
export type ApiCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: string
}

/** A curated link to the best free external resource for a lesson. */
export type ApiResourceLink = {
  title: string
  url: string
  license?: string
}

/** A license-compliant article imported in-app for a lesson. */
export type ApiImportedResource = {
  id: string
  source: string
  title: string
  url: string
  license: string | null
  body: string | null
  fetched_at: string
}

/** A single lesson; `progress` / `is_completed` are attached when a
 *  logged-in user's per-lesson state exists. */
export type ApiLesson = {
  id: string
  module_id: string
  title: string
  content: string | null
  video_url: string | null
  duration: string | null
  order: number
  is_published: boolean
  resource_links?: ApiResourceLink[]
  resources?: ApiImportedResource[]
  created_at: string
  progress?: number
  is_completed?: boolean
}

/** One end-of-module quiz question (correct index included so the workspace
 *  can grade in-app; it is a self-check, not a certification). */
export type ApiQuizQuestion = {
  question: string
  options: string[]
  correct_index: number
  explanation: string | null
}

export type ApiQuiz = {
  module_id: string
  title: string
  pass_percent: number
  questions: ApiQuizQuestion[]
}

export type ApiQuizResult = {
  id: string
  module_id: string
  score: number
  passed: boolean
  total_questions: number
  created_at: string
}

export type ApiModule = {
  id: string
  course_id: string
  title: string
  description: string | null
  order: number
  quiz?: ApiQuiz | null
  quiz_result?: ApiQuizResult | null
  created_at: string
  lessons: ApiLesson[]
}

export type ApiCourse = {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  level: string
  duration: string | null
  price: number
  is_published: boolean
  is_featured: boolean
  is_ai_generated: boolean
  image_url: string | null
  lesson_count?: number
  category: ApiCategory | null
  modules?: ApiModule[]
}

export type CreateCoursePayload = {
  title: string
  slug: string
  short_description?: string
  description?: string
  level: string
  duration?: string
  price?: number
  is_published: boolean
  is_featured: boolean
  is_ai_generated: boolean
  image_url?: string
  category_id?: string
  modules?: CreateCourseModule[]
}

export type CreateCourseLesson = {
  title: string
  content?: string
  video_url?: string
  duration?: string
  order: number
  is_published: boolean
}

export type CreateCourseModule = {
  title: string
  description?: string
  order: number
  lessons: CreateCourseLesson[]
}

/** GET /api/courses — only published courses for the public catalog. */
export function listCourses() {
  return apiRequest<ApiCourse[]>('/api/courses?published=true')
}

/** GET /api/courses/categories — filter chips on the catalog page. */
export function listCategories() {
  return apiRequest<ApiCategory[]>('/api/courses/categories')
}

/** GET /api/courses/slug/:slug — detail incl. modules/lessons + progress. */
export function getCourseBySlug(slug: string) {
  return apiRequest<ApiCourse>(`/api/courses/slug/${slug}`)
}

/** POST /api/courses — admin: create a course (optionally with modules). */
export function createCourse(payload: CreateCoursePayload) {
  return apiRequest<ApiCourse>('/api/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type ApiEnrollment = {
  id: string
  user_id: string
  course_id: string
  progress: number
  created_at: string
  /** Self-assessed starting level from the enrollment onboarding survey. */
  skill_level?: 'beginner' | 'intermediate' | 'expert'
  /** Free-text learning goal captured during onboarding. */
  learning_goal?: string | null
}

/** Onboarding answers collected before/at enrollment time. */
export type CourseOnboardingPayload = {
  skill_level?: 'beginner' | 'intermediate' | 'expert'
  learning_goal?: string | null
}

export type ApiEnrollmentDetail = {
  id: string
  course_id: string
  course_title: string
  course_slug: string
  course_image_url: string | null
  course_category: string | null
  level: string
  skill_level?: 'beginner' | 'intermediate' | 'expert'
  learning_goal?: string | null
  enrolled_at: string
  completed_at: string | null
  progress: number
  total_lessons: number
  completed_lessons: number
  progress_percent: number
  is_completed: boolean
}

export type ApiLessonProgress = {
  is_completed: boolean
  progress: number
  quiz_score: number | null
  course_progress_percent: number | null
  completed_lessons: number | null
  total_lessons: number | null
}

export type AskResponse = {
  answer: string
  conversation_id: string
}

/** POST /api/courses/slug/:slug/enroll — enroll in a course by slug.
 * Optional onboarding answers (skill level + learning goal) are stored on the
 * enrollment so the learning experience can be tailored to the learner. */
export function enrollInCourse(slug: string, onboarding?: CourseOnboardingPayload) {
  return apiRequest<ApiEnrollment>(`/api/courses/slug/${slug}/enroll`, {
    method: 'POST',
    body: JSON.stringify(onboarding ?? {}),
  })
}

/** PATCH /api/enrollments/:id/onboarding — update a course's onboarding
 * answers after enrollment (e.g. the learner revises their level/goal). */
export function updateEnrollmentOnboarding(enrollmentId: string, onboarding: CourseOnboardingPayload) {
  return apiRequest<ApiEnrollmentDetail>(`/api/enrollments/${enrollmentId}/onboarding`, {
    method: 'PATCH',
    body: JSON.stringify(onboarding),
  })
}

/** GET /api/courses/enrollments/me — current user's courses + progress. */
export function listMyEnrollments() {
  return apiRequest<ApiEnrollmentDetail[]>('/api/courses/enrollments/me')
}

/** POST /api/courses/slug/:slug/restart — wipe progress, start fresh. */
export function restartCourse(slug: string) {
  return apiRequest<ApiEnrollment>(`/api/courses/slug/${slug}/restart`, {
    method: 'POST',
  })
}

/** POST /api/lessons/:id/complete — mark a lesson finished (100%). */
export function completeLesson(lessonId: string) {
  return apiRequest<ApiLesson & ApiLessonProgress>(`/api/lessons/${lessonId}/complete`, {
    method: 'POST',
  })
}

/** PATCH /api/lessons/:id/progress — persist 0-100 progress + quiz score. */
export function updateLessonProgress(lessonId: string, progress: number, quizScore?: number) {
  return apiRequest<ApiLesson & ApiLessonProgress>(`/api/lessons/${lessonId}/progress`, {
    method: 'PATCH',
    // quiz_score is only sent when the caller provides it.
    body: JSON.stringify({ progress, ...(quizScore !== undefined ? { quiz_score: quizScore } : {}) }),
  })
}

/** GET /api/modules/:id/quiz — end-of-module self-check questions. */
export function getModuleQuiz(moduleId: string) {
  return apiRequest<ApiQuiz>(`/api/modules/${moduleId}/quiz`)
}

/** GET /api/modules/:id/quiz/result — latest attempt (or null). */
export function getModuleQuizResult(moduleId: string) {
  return apiRequest<ApiQuizResult | null>(`/api/modules/${moduleId}/quiz/result`)
}

/** POST /api/modules/:id/quiz/result — record a graded attempt. */
export function submitQuizResult(
  moduleId: string,
  score: number,
  passed: boolean,
  totalQuestions: number,
) {
  return apiRequest<ApiQuizResult>(`/api/modules/${moduleId}/quiz/result`, {
    method: 'POST',
    body: JSON.stringify({ score, passed, total_questions: totalQuestions }),
  })
}

/** POST /api/courses/slug/:slug/ask — ask Cora about this course.
 * `conversationId` is optional: omit it to start a new chat, or pass one
 * to continue that conversation. */
export function askCora(slug: string, question: string, conversationId?: string | null) {
  return apiRequest<AskResponse>(`/api/courses/slug/${slug}/ask`, {
    method: 'POST',
    body: JSON.stringify({ question, ...(conversationId ? { conversation_id: conversationId } : {}) }),
  })
}

/** One persisted chat turn (user or assistant) on a course conversation. */
export type ApiChatMessage = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/** A chat-thread row shown in the Cora sidebar chat list. */
export type ApiConversationSummary = {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

/** GET /api/courses/slug/:slug/conversations — this user's chat list. */
export function listCourseConversations(slug: string) {
  return apiRequest<ApiConversationSummary[]>(`/api/courses/slug/${slug}/conversations`)
}

/** GET /api/courses/slug/:slug/conversation/:id — one chat's full history. */
export function getCourseConversation(slug: string, conversationId: string) {
  return apiRequest<ApiChatMessage[]>(`/api/courses/slug/${slug}/conversation/${conversationId}`)
}

/** DELETE /api/courses/slug/:slug/conversation/:id — remove a chat. */
export function deleteCourseConversation(slug: string, conversationId: string) {
  return apiRequest<void>(`/api/courses/slug/${slug}/conversation/${conversationId}`, {
    method: 'DELETE',
  })
}

/** POST /api/newsletter/subscribe — footer signup form. */
export function subscribeNewsletter(email: string) {
  return apiRequest<{ ok: boolean; message?: string }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/**
 * GET /api/courses/slug/:slug/pdf — download the course as a PDF. Requires
 * an enrolled user at ≥50% progress (the backend enforces the gate). The
 * PDF is fetched as a blob (credentials included) and saved client-side.
 */
export async function downloadCoursePdf(slug: string): Promise<void> {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const response = await fetch(`${base}/api/courses/slug/${slug}/pdf`, {
    credentials: 'include',
  })
  if (!response.ok) {
    let message = `Could not download the PDF (${response.status}).`
    try {
      const data = await response.json()
      if (typeof data.detail === 'string') message = data.detail
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slug}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
