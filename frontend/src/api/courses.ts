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
  return apiRequest<ApiCourse[]>('/courses?published=true')
}

export function listCategories() {
  return apiRequest<ApiCategory[]>('/courses/categories')
}

export function getCourseBySlug(slug: string) {
  return apiRequest<ApiCourse>(`/courses/slug/${slug}`)
}

export function createCourse(payload: CreateCoursePayload) {
  return apiRequest<ApiCourse>('/courses', {
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

export type AskResponse = {
  answer: string
}

export function enrollInCourse(slug: string) {
  return apiRequest<ApiEnrollment>(`/courses/slug/${slug}/enroll`, {
    method: 'POST',
  })
}

export function askCora(slug: string, question: string) {
  return apiRequest<AskResponse>(`/courses/slug/${slug}/ask`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export function subscribeNewsletter(email: string) {
  return apiRequest<{ ok: boolean; message?: string }>('/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
