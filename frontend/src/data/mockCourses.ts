export type MockCourse = {
  id: string
  slug: string
  title: string
  shortDescription: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  price: number
  category: string
  categoryIcon: string
  isFeatured?: boolean
}

export const mockCourses: MockCourse[] = [
  {
    id: '1',
    slug: 'ai-tutor-foundations',
    title: 'AI Tutor Foundations',
    shortDescription: 'Prompting, evaluation, and safe defaults for learning products.',
    level: 'beginner',
    duration: '4 weeks',
    price: 0,
    category: 'AI & ML',
    categoryIcon: 'fa-solid fa-robot',
    isFeatured: true,
  },
  {
    id: '2',
    slug: 'full-stack-fastapi-react',
    title: 'Full-Stack FastAPI + React',
    shortDescription: 'Ship a production-grade SPA with typed APIs and Tailwind UI.',
    level: 'intermediate',
    duration: '6 weeks',
    price: 49,
    category: 'Web Dev',
    categoryIcon: 'fa-solid fa-code',
  },
  {
    id: '3',
    slug: 'data-literacy-essentials',
    title: 'Data Literacy Essentials',
    shortDescription: 'Charts, metrics, and decision-making without the jargon.',
    level: 'beginner',
    duration: '3 weeks',
    price: 29,
    category: 'Data',
    categoryIcon: 'fa-solid fa-chart-column',
  },
]

export const mockCategories = [
  { id: 'all', label: 'All topics', icon: 'fa-solid fa-layer-group' },
  { id: 'AI & ML', label: 'AI & ML', icon: 'fa-solid fa-robot' },
  { id: 'Web Dev', label: 'Web Development', icon: 'fa-solid fa-code' },
  { id: 'Data', label: 'Data', icon: 'fa-solid fa-chart-column' },
] as const
