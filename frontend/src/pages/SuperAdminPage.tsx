import { useState } from 'react'
import { createAdmin, type AdminCreatePayload } from '@/api/auth'
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

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

function generateUsername(email: string, fullName: string) {
  const fromName = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '')
  if (fromName) return fromName
  const handle = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9.]/g, '')
  return handle || 'admin'
}

function generatePassword() {
  const array = new Uint8Array(12)
  window.crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function SuperAdminPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status.kind === 'submitting') return
    if (!email.trim()) {
      setStatus({ kind: 'error', message: 'Email is required.' })
      return
    }

    const payload: AdminCreatePayload = {
      email: email.trim(),
      full_name: fullName.trim() || undefined,
      username: generateUsername(email.trim(), fullName.trim()),
      password: generatePassword(),
      role,
    }

    setStatus({ kind: 'submitting' })
    try {
      const created = await createAdmin(payload)
      setStatus({
        kind: 'success',
        message: `Created ${created.role} account for ${created.email} (${created.username}). Share the temporary password securely.`,
      })
      setEmail('')
      setFullName('')
      setRole('admin')
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not create admin.',
      })
    }
  }

  return (
    <DashboardLayout
      title="Super Admin"
      subtitle="Platform operations and admin provisioning"
      navItems={superNav}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          {platformStats.map((stat) => (
            <div key={stat.label} className="courser-card p-5">
              <p className="text-sm font-semibold text-stone-600">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-stone-900">{stat.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="courser-card p-6 lg:col-span-2">
            <p className="text-sm font-semibold text-primary">Admins</p>
            <h2 className="text-xl font-bold text-stone-900">Create and review admin accounts</h2>
            <p className="mt-3 text-sm text-stone-600">
              COURSER admin teams manage free courses, environment presets, publishing quality, and mascot behavior.
            </p>

            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
              <div className="sm:col-span-2">
                <label htmlFor="admin-email" className="mb-1 block text-sm font-semibold text-stone-700">
                  Admin email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="new.admin@courser.local"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
              <div>
                <label htmlFor="admin-name" className="mb-1 block text-sm font-semibold text-stone-700">
                  Display name
                </label>
                <input
                  id="admin-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
              <div>
                <label htmlFor="admin-role" className="mb-1 block text-sm font-semibold text-stone-700">
                  Role
                </label>
                <select
                  id="admin-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={status.kind === 'submitting'}
                  className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i className="fa-solid fa-user-plus mr-2" aria-hidden />
                  {status.kind === 'submitting' ? 'Creating…' : 'Create admin'}
                </button>
                {status.kind === 'success' ? (
                  <p className="text-sm font-semibold text-green-700" role="status">
                    <i className="fa-solid fa-circle-check mr-1" aria-hidden /> {status.message}
                  </p>
                ) : null}
                {status.kind === 'error' ? (
                  <p className="text-sm font-semibold text-red-600" role="alert">
                    <i className="fa-solid fa-circle-exclamation mr-1" aria-hidden /> {status.message}
                  </p>
                ) : null}
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="courser-card p-6">
              <p className="text-sm font-semibold text-stone-900">Platform pulse</p>
              <dl className="mt-4 space-y-4">
                {platformStats.slice(0, 3).map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <dt className="text-sm text-stone-600">{stat.label}</dt>
                    <dd className="text-lg font-bold text-stone-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-stone-500">
                COURSER-owned sample metrics until reporting endpoints are connected.
              </p>
            </div>
            <div className="courser-card p-6 ring-1 ring-primary/10">
              <p className="text-sm font-semibold text-primary">Admin quality queue</p>
              <p className="mt-2 text-sm text-stone-700">
                3 new course environments need review, 2 mascot scripts need approval, and 6 lessons are ready to publish.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
