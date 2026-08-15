/**
 * Fallback catalog data — mirrors the FALLBACK_CATEGORIES / FALLBACK_COURSES
 * constants in backend/app/api/courses.py. Returned by the public read
 * endpoints when the database is unreachable (e.g. Neon cold-start on a
 * serverless host), so the catalog never renders empty.
 */
export interface FallbackCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface FallbackLesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  video_url: null;
  duration: string;
  order: number;
  is_published: boolean;
  created_at: string;
}

export interface FallbackModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
  lessons: FallbackLesson[];
}

export interface FallbackCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  level: string;
  duration: string;
  price: number;
  is_published: boolean;
  is_featured: boolean;
  is_ai_generated: boolean;
  image_url: string | null;
  category_id: string;
  instructor_id: null;
  created_at: string;
  updated_at: string;
  category: FallbackCategory;
  modules: FallbackModule[];
}

const NOW = "2026-05-13T12:00:00";

export const FALLBACK_CATEGORIES: FallbackCategory[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Web Development",
    slug: "web-development",
    description: "Frontend and full-stack web skills.",
    icon: "fa-globe",
    created_at: NOW,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Data Science",
    slug: "data-science",
    description: "Python analysis, charts, and reporting.",
    icon: "fa-database",
    created_at: NOW,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "AI & Machine Learning",
    slug: "ai-ml",
    description: "Practical AI workflows for learning and content.",
    icon: "fa-brain",
    created_at: NOW,
  },
];

export const FALLBACK_COURSES: FallbackCourse[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "Frontend Foundations with React",
    slug: "frontend-foundations-react",
    description:
      "Build responsive interfaces with HTML, CSS, JavaScript, React components, and reusable UI patterns.",
    short_description: "Create polished React pages from the ground up.",
    level: "beginner",
    duration: "4 weeks",
    price: 0.0,
    is_published: true,
    is_featured: true,
    is_ai_generated: false,
    image_url: null,
    category_id: "11111111-1111-4111-8111-111111111111",
    instructor_id: null,
    created_at: NOW,
    updated_at: NOW,
    category: FALLBACK_CATEGORIES[0],
    modules: [
      {
        id: "aaaaaaaa-0001-4000-8000-aaaaaaaaaaaa",
        course_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "Build the page structure",
        description: "Start with semantic HTML and layout thinking.",
        order: 1,
        created_at: NOW,
        lessons: [
          {
            id: "aaaaaaaa-0001-4000-8001-aaaaaaaaaaaa",
            module_id: "aaaaaaaa-0001-4000-8000-aaaaaaaaaaaa",
            title: "How the web page is assembled",
            content:
              "You will learn how headings, sections, links, images, and forms create a meaningful page structure before styling begins.",
            video_url: null,
            duration: "12 min",
            order: 1,
            is_published: true,
            created_at: NOW,
          },
          {
            id: "aaaaaaaa-0001-4000-8002-aaaaaaaaaaaa",
            module_id: "aaaaaaaa-0001-4000-8000-aaaaaaaaaaaa",
            title: "Responsive layout with flex and grid",
            content:
              "Practice building a course-card layout that works on mobile, tablet, and desktop screens.",
            video_url: null,
            duration: "18 min",
            order: 2,
            is_published: true,
            created_at: NOW,
          },
        ],
      },
    ],
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    title: "Python Data Analysis Starter",
    slug: "python-data-analysis-starter",
    description:
      "Use Python, pandas, and charts to clean data, answer questions, and explain insights.",
    short_description: "Analyze real datasets with Python basics and pandas.",
    level: "beginner",
    duration: "3 weeks",
    price: 0.0,
    is_published: true,
    is_featured: true,
    is_ai_generated: false,
    image_url: null,
    category_id: "22222222-2222-4222-8222-222222222222",
    instructor_id: null,
    created_at: NOW,
    updated_at: NOW,
    category: FALLBACK_CATEGORIES[1],
    modules: [
      {
        id: "bbbbbbbb-0001-4000-8000-bbbbbbbbbbbb",
        course_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        title: "Python for data work",
        description: "Learn the minimum Python needed for analysis.",
        order: 1,
        created_at: NOW,
        lessons: [
          {
            id: "bbbbbbbb-0001-4000-8001-bbbbbbbbbbbb",
            module_id: "bbbbbbbb-0001-4000-8000-bbbbbbbbbbbb",
            title: "Cleaning a messy table",
            content:
              "Use pandas to rename columns, handle missing values, and prepare a dataset for reporting.",
            video_url: null,
            duration: "24 min",
            order: 1,
            is_published: true,
            created_at: NOW,
          },
        ],
      },
    ],
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    title: "AI Prompting for Course Creators",
    slug: "ai-prompting-course-creators",
    description:
      "Plan lessons, quizzes, examples, and feedback using practical AI prompting workflows.",
    short_description: "Use AI to draft better lessons and support learners.",
    level: "intermediate",
    duration: "2 weeks",
    price: 0.0,
    is_published: true,
    is_featured: true,
    is_ai_generated: false,
    image_url: null,
    category_id: "33333333-3333-4333-8333-333333333333",
    instructor_id: null,
    created_at: NOW,
    updated_at: NOW,
    category: FALLBACK_CATEGORIES[2],
    modules: [
      {
        id: "cccccccc-0001-4000-8000-cccccccccccc",
        course_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        title: "Prompt with purpose",
        description: "Write prompts that produce usable teaching material.",
        order: 1,
        created_at: NOW,
        lessons: [
          {
            id: "cccccccc-0001-4000-8001-cccccccccccc",
            module_id: "cccccccc-0001-4000-8000-cccccccccccc",
            title: "Define learner level and outcome",
            content:
              "Turn a broad topic into a clear learning objective, prerequisite list, and success check.",
            video_url: null,
            duration: "14 min",
            order: 1,
            is_published: true,
            created_at: NOW,
          },
        ],
      },
    ],
  },
];

export function fallbackCourseBySlug(slug: string): FallbackCourse | undefined {
  return FALLBACK_COURSES.find((c) => c.slug === slug);
}