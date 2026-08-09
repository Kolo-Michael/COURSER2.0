import { apiRequest } from './client'

export type ApiCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: string
}

export type ApiLesson = {
  id: string
  module_id: string
  title: string
  content: string | null
  video_url: string | null
  duration: string | null
  order: number
  is_published: boolean
  created_at: string
  progress?: number
  is_completed?: boolean
}

export type ApiModule = {
  id: string
  course_id: string
  title: string
  description: string | null
  order: number
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

export function listCourses() {
  return apiRequest<ApiCourse[]>('/api/courses?published=true')
}

export function listCategories() {
  return apiRequest<ApiCategory[]>('/api/courses/categories')
}

export function getCourseBySlug(slug: string) {
  return apiRequest<ApiCourse>(`/api/courses/slug/${slug}`)
}

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
}

export type ApiEnrollmentDetail = {
  id: string
  course_id: string
  course_title: string
  course_slug: string
  course_category: string | null
  level: string
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
}

export function enrollInCourse(slug: string) {
  return apiRequest<ApiEnrollment>(`/api/courses/slug/${slug}/enroll`, {
    method: 'POST',
  })
}

export function listMyEnrollments() {
  return apiRequest<ApiEnrollmentDetail[]>('/api/courses/enrollments/me')
}

export function restartCourse(slug: string) {
  return apiRequest<ApiEnrollment>(`/api/courses/slug/${slug}/restart`, {
    method: 'POST',
  })
}

export function completeLesson(lessonId: string) {
  return apiRequest<ApiLesson & ApiLessonProgress>(`/api/lessons/${lessonId}/complete`, {
    method: 'POST',
  })
}

export function updateLessonProgress(lessonId: string, progress: number, quizScore?: number) {
  return apiRequest<ApiLesson & ApiLessonProgress>(`/api/lessons/${lessonId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ progress, ...(quizScore !== undefined ? { quiz_score: quizScore } : {}) }),
  })
}

export function askCora(slug: string, question: string) {
  return apiRequest<AskResponse>(`/api/courses/slug/${slug}/ask`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export function subscribeNewsletter(email: string) {
  return apiRequest<{ ok: boolean; message?: string }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
