import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">COURSER</p>
          <p className="mt-2 max-w-sm text-sm text-slate-600">
            AI-assisted learning paths with the structure learners expect—from discovery to enrollment
            and progress.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Explore</span>
          <Link to="/courses" className="hover:text-primary">
            Courses
          </Link>
          <Link to="/auth?mode=signup" className="hover:text-primary">
            Create account
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-200/80 bg-white">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          Built for learners, admins, and platform owners — responsive layouts and JWT-ready flows.
        </p>
      </div>
    </footer>
  )
}
