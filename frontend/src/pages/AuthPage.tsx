import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { Link, useSearchParams } from 'react-router-dom'

export function AuthPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <i className="fa-solid fa-graduation-cap" aria-hidden />
            </span>
            <span className="text-lg text-slate-900">COURSER</span>
          </Link>
          <Link
            to="/courses"
            className="text-sm font-semibold text-slate-700 hover:text-primary"
          >
            Browse courses
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-start lg:px-8">
        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Authentication</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {mode === 'signup' ? 'Create your learner account' : 'Welcome back'}
          </h1>
          <p className="text-slate-600">
            JWT-ready flows for students, admins, and super admins. Wire these forms to `/auth/login`
            and `/auth/signup` when the API is available.
          </p>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-2">
              <i className="fa-solid fa-shield-halved mt-0.5 text-primary" aria-hidden />
              Role-based redirects after sign-in (student, admin, super_admin).
            </li>
            <li className="flex gap-2">
              <i className="fa-solid fa-bolt mt-0.5 text-accent" aria-hidden />
              Access + refresh token handling will plug in here.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            <Link
              to="/auth"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              className={`flex-1 rounded-md py-2 text-center transition ${
                mode === 'signup' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign up
            </Link>
          </div>
          {mode === 'login' ? <LoginForm /> : <SignupForm />}
        </section>
      </div>
    </div>
  )
}
