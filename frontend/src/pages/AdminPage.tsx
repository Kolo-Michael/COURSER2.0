import { createCourse, listCategories, type ApiCategory } from '@/api/courses'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const adminNav = [
  { to: '/admin', label: 'Course management', iconClass: 'fa-solid fa-chalkboard-user' },
  { to: '/courses', label: 'Preview catalog', iconClass: 'fa-solid fa-eye' },
]

const environmentStyles = [
  { id: 'focus', label: 'Focus', icon: 'fa-solid fa-bullseye', tone: 'bg-blue-50 text-primary' },
  { id: 'studio', label: 'Studio', icon: 'fa-solid fa-display', tone: 'bg-slate-100 text-slate-700' },
  { id: 'guided', label: 'Guided', icon: 'fa-solid fa-route', tone: 'bg-orange-50 text-accent' },
]

const mascots = [
  { id: 'cora', name: 'Cora', accent: 'bg-primary' },
  { id: 'nova', name: 'Nova', accent: 'bg-accent' },
  { id: 'sage', name: 'Sage', accent: 'bg-emerald-600' },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type DraftLesson = {
  title: string
  duration: string
  content: string
}

type DraftModule = {
  title: string
  description: string
  lessons: DraftLesson[]
}

function createDraftModule(): DraftModule {
  return {
    title: '',
    description: '',
    lessons: [{ title: '', duration: '', content: '' }],
  }
}

export function AdminPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState('beginner')
  const [duration, setDuration] = useState('Self-paced')
  const [categoryId, setCategoryId] = useState('')
  const [modules, setModules] = useState<DraftModule[]>([createDraftModule()])
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [environment, setEnvironment] = useState('focus')
  const [mascot, setMascot] = useState('cora')
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    listCategories()
      .then((data) => {
        if (active) {
          setCategories(data)
          setCategoryId(data[0]?.id ?? '')
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Categories could not be loaded. You can still draft the course.')
        }
      })

    return () => {
      active = false
    }
  }, [])

  const selectedMascot = useMemo(
    () => mascots.find((item) => item.id === mascot) ?? mascots[0],
    [mascot],
  )

  const organizedModules = useMemo(
    () =>
      modules
        .map((module, moduleIndex) => ({
          title: module.title.trim(),
          description: module.description.trim(),
          order: moduleIndex + 1,
          lessons: module.lessons
            .map((lesson, lessonIndex) => ({
              title: lesson.title.trim(),
              content: lesson.content.trim(),
              duration: lesson.duration.trim(),
              order: lessonIndex + 1,
              is_published: published,
            }))
            .filter((lesson) => lesson.title),
        }))
        .filter((module) => module.title),
    [modules, published],
  )

  function updateModule(index: number, field: keyof DraftModule, value: string) {
    setModules((current) =>
      current.map((module, moduleIndex) => (moduleIndex === index ? { ...module, [field]: value } : module)),
    )
  }

  function updateLesson(moduleIndex: number, lessonIndex: number, field: keyof DraftLesson, value: string) {
    setModules((current) =>
      current.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.map((lesson, currentLessonIndex) =>
                currentLessonIndex === lessonIndex ? { ...lesson, [field]: value } : lesson,
              ),
            }
          : module,
      ),
    )
  }

  function addLesson(moduleIndex: number) {
    setModules((current) =>
      current.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? { ...module, lessons: [...module.lessons, { title: '', duration: '', content: '' }] }
          : module,
      ),
    )
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    setModules((current) =>
      current.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? { ...module, lessons: module.lessons.filter((_, currentLessonIndex) => currentLessonIndex !== lessonIndex) }
          : module,
      ),
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const saved = await createCourse({
        title,
        slug: slugify(title),
        short_description: summary,
        description,
        level,
        duration,
        price: 0,
        is_published: published,
        is_featured: false,
        is_ai_generated: false,
        category_id: categoryId || undefined,
        modules: organizedModules,
      })

      setMessage(`Saved "${saved.title}" as a free course with the ${selectedMascot.name} learning environment.`)
      setTitle('')
      setSummary('')
      setDescription('')
      setModules([createDraftModule()])
      setCoverPreview(null)
    } catch {
      setMessage('Course could not be saved yet. Check the backend connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout
      title="Admin workspace"
      subtitle="Create free courses and set the learning environment"
      navItems={adminNav}
    >
      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Course setup</p>
              <h2 className="text-xl font-bold text-slate-900">Add a free course</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Every course is free for learners. Admins choose the cover image and learning environment before publishing.
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
              Free by default
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Course title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="Example: Product Design Foundations"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Short summary</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={3}
                placeholder="A concise promise learners will understand at a glance."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">Category</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option value="">General</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">Level</span>
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm capitalize focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">Duration</span>
              <input
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">Course cover picture</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  setCoverPreview(file ? URL.createObjectURL(file) : null)
                }}
                className="mt-1 w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Course description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder="What learners will build, practice, and understand."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </label>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Organized course outline</p>
                <p className="mt-1 text-sm text-slate-600">Build the structure learners will follow: modules first, lessons inside each module.</p>
              </div>
              <button
                type="button"
                onClick={() => setModules((current) => [...current, createDraftModule()])}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <i className="fa-solid fa-plus mr-2" aria-hidden />
                Add module
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">Module {moduleIndex + 1}</p>
                    {modules.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setModules((current) => current.filter((_, index) => index !== moduleIndex))}
                        className="rounded-lg px-2 py-1 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label>
                      <span className="text-sm font-semibold text-slate-700">Module title</span>
                      <input
                        value={module.title}
                        onChange={(event) => updateModule(moduleIndex, 'title', event.target.value)}
                        placeholder="Example: Research and planning"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold text-slate-700">Module description</span>
                      <input
                        value={module.description}
                        onChange={(event) => updateModule(moduleIndex, 'description', event.target.value)}
                        placeholder="What this module covers"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </label>
                  </div>

                  <div className="mt-4 space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                          <label>
                            <span className="text-sm font-semibold text-slate-700">Lesson {lessonIndex + 1}</span>
                            <input
                              value={lesson.title}
                              onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'title', event.target.value)}
                              placeholder="Lesson title"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                            />
                          </label>
                          <label>
                            <span className="text-sm font-semibold text-slate-700">Duration</span>
                            <input
                              value={lesson.duration}
                              onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'duration', event.target.value)}
                              placeholder="15 min"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeLesson(moduleIndex, lessonIndex)}
                            disabled={module.lessons.length === 1}
                            className="self-end rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Remove lesson ${lessonIndex + 1}`}
                          >
                            <i className="fa-solid fa-trash" aria-hidden />
                          </button>
                        </div>
                        <textarea
                          value={lesson.content}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'content', event.target.value)}
                          rows={2}
                          placeholder="Lesson content, notes, or objective."
                          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addLesson(moduleIndex)}
                    className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <i className="fa-solid fa-plus mr-2" aria-hidden />
                    Add lesson
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Learning environment</p>
            <p className="mt-1 text-sm text-slate-600">Only admins can change this setup. Learners receive the default environment with a question-answering mascot.</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {environmentStyles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEnvironment(item.id)}
                  className={`rounded-lg border px-3 py-3 text-center text-xs font-semibold ${
                    environment === item.id ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <i className={`${item.icon} mb-2 block text-lg`} aria-hidden />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              {mascots.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMascot(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${
                    mascot === item.id ? 'border-primary bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <span className={`relative h-10 w-10 rounded-full ${item.accent}`}>
                    <span className="absolute left-2.5 top-3 h-1.5 w-1.5 rounded-full bg-white" />
                    <span className="absolute right-2.5 top-3 h-1.5 w-1.5 rounded-full bg-white" />
                    <span className="absolute bottom-3 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-white" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{item.name}</span>
                    <span className="block text-xs text-slate-500">Answers learner questions</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="h-36 bg-slate-100">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <i className="fa-regular fa-image text-3xl" aria-hidden />
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Free</span>
                <span className="text-xs font-semibold uppercase text-slate-500">{environment}</span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900">{title || 'Course title preview'}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {summary || 'Your course summary will appear here for students.'}
              </p>
              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-semibold uppercase text-primary">{selectedMascot.name}</p>
                <p className="mt-1 text-sm text-slate-700">Ask me anything about this lesson.</p>
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Outline</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {organizedModules.length} modules, {organizedModules.reduce((total, module) => total + module.lessons.length, 0)} lessons
                </p>
              </div>
            </div>
          </section>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            Publish immediately
          </label>

          {message ? (
            <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-primary">
              {message}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className="fa-solid fa-floppy-disk mr-2" aria-hidden />
              {saving ? 'Saving...' : 'Save free course'}
            </button>
            <Link
              to="/courses"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Preview
            </Link>
          </div>
        </aside>
      </form>
    </DashboardLayout>
  )
}
