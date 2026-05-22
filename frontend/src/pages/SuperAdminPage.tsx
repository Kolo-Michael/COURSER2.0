import { DashboardLayout } from '@/components/layout/DashboardLayout'

const superNav = [
  { to: '/super-admin', label: 'Overview', iconClass: 'fa-solid fa-gauge-high' },
  { to: '/admin', label: 'Admin workspace', iconClass: 'fa-solid fa-user-shield' },
  { to: '/courses', label: 'Catalog', iconClass: 'fa-solid fa-layer-group' },
]

const platformStats = [
  { label: 'Active admins', value: '4' },
  { label: 'Students', value: '1,248' },
  { label: 'Published courses', value: '12' },
  { label: 'Avg. completion', value: '68%' },
]

export function SuperAdminPage() {
  return (
    <DashboardLayout
      title="Super Admin"
      subtitle="Platform operations and admin provisioning"
      navItems={superNav}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          {platformStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <p className="text-sm font-semibold text-primary">Admins</p>
            <h2 className="text-xl font-bold text-slate-900">Create and review admin accounts</h2>
            <p className="mt-3 text-sm text-slate-600">
              COURSER admin teams manage free courses, environment presets, publishing quality, and mascot behavior.
            </p>

            <form className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="admin-email" className="mb-1 block text-sm font-semibold text-slate-700">
                  Admin email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="new.admin@courser.local"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
              <div>
                <label htmlFor="admin-name" className="mb-1 block text-sm font-semibold text-slate-700">
                  Display name
                </label>
                <input
                  id="admin-name"
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
              <div>
                <label htmlFor="admin-role" className="mb-1 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  id="admin-role"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  defaultValue="admin"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-105"
                >
                  <i className="fa-solid fa-user-plus mr-2" aria-hidden />
                  Create admin
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Platform pulse</p>
              <dl className="mt-4 space-y-4">
                {platformStats.slice(0, 3).map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <dt className="text-sm text-slate-600">{stat.label}</dt>
                    <dd className="text-lg font-bold text-slate-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                COURSER-owned sample metrics until reporting endpoints are connected.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-primary/5 p-6 shadow-inner">
              <p className="text-sm font-semibold text-primary">Admin quality queue</p>
              <p className="mt-2 text-sm text-slate-700">
                3 new course environments need review, 2 mascot scripts need approval, and 6 lessons are ready to publish.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
