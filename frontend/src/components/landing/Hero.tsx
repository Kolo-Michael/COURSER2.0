export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-gradient-to-br from-primary via-[#1d4ed8] to-[#1e40af]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgb(249 115 22 / 0.35), transparent 45%), radial-gradient(circle at 85% 10%, rgb(249 115 22 / 0.2), transparent 40%), radial-gradient(circle at 50% 100%, rgb(255 255 255 / 0.08), transparent 50%)',
        }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="flex-1">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur">
            <i className="fa-solid fa-rocket text-accent" aria-hidden="true" />
            AI-powered courses, built for real progress
          </p>

          <h1
            id="hero-heading"
            className="text-balance font-bold tracking-tight text-white drop-shadow-sm"
          >
            <span className="block text-4xl sm:text-5xl lg:text-6xl">
              Learn smarter with
            </span>
            <span className="mt-2 block text-4xl text-white sm:text-5xl lg:text-6xl">
              <span className="text-accent">COURSER:</span>{' '}
              <span className="font-normal text-white/90">your intelligent campus</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-50 sm:text-xl">
            Browse curated paths, enroll in seconds, and follow lessons shaped by AI without
            losing the clarity of a world-class LMS.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-900/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get started free
              <i className="fa-solid fa-arrow-right text-sm opacity-90" aria-hidden="true" />
            </a>
            <a
              href="/courses"
              className="inline-flex items-center justify-center rounded-lg bg-white/10 px-6 py-3.5 text-base font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore courses
            </a>
          </div>

          <dl className="mt-14 grid gap-8 sm:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 text-accent ring-1 ring-white/15">
                <i className="fa-solid fa-graduation-cap text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-white">Expert-style structure</dt>
                <dd className="mt-1 text-sm text-blue-100">Modules and lessons designed for clarity</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 text-accent ring-1 ring-white/15">
                <i className="fa-solid fa-book-open text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-white">Learn at your pace</dt>
                <dd className="mt-1 text-sm text-blue-100">Resume anytime, anywhere</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 text-accent ring-1 ring-white/15">
                <i className="fa-solid fa-shield-halved text-lg" aria-hidden="true" />
              </div>
              <div>
                <dt className="font-semibold text-white">Roles that scale</dt>
                <dd className="mt-1 text-sm text-blue-100">Built for students, admins, and owners</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="flex-1">
          <div className="relative mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200/60 lg:max-w-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Spotlight
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">AI Tutor Foundations</h2>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/25">
                New
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              A polished intro path covering LLM basics, responsible use, and how to apply models
              in learning products, matching the Modules & Lessons structure your teams expect.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                Module 1: Foundations & prompting playbooks
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                Module 2: Evaluation guardrails & safety habits
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                Capstone lesson: Ship a tutoring micro-feature
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/courses"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Preview catalog
              </a>
              <a
                href="/auth"
                className="inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-primary ring-2 ring-primary/30 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Create account
              </a>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-blue-100/90 sm:text-left">
            Trusted by teams who want a Coursera-grade experience with modern automation.
          </p>
        </div>
      </div>
    </section>
  )
}
