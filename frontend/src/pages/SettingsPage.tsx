// ─── SettingsPage: profile / appearance / navigation / notifications / security ─
// Signed-in settings for every role. Loads the full user profile on mount,
// then lets the user edit their display name + avatar (resized + compressed
// client-side before upload), pick the theme, configure email notifications,
// change their password (validated client-side), and sign out.

import { getMe, updateProfile, changePassword, logout, type ApiUser } from '@/api/auth'
import { getSession, clearSession } from '@/auth/session'
import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'
import { navItemsFor } from '@/components/layout/navItems'
import { getNavCollapsed, setNavCollapsed, setNavStyle } from '@/auth/preferences'
import { useTheme } from '@/theme'
import { resizeImage, validateAvatarFile } from '@/utils/image'
import { useEffect, useRef, useState } from 'react'

// Fine-grained submit status per section: idle -> saving -> saved / error.
type Status = 'idle' | 'saving' | 'saved' | 'error'

// Shared card shell for each settings section (icon, heading, body).
function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="courser-card p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary-dark/15 dark:text-primary-dark">
          <i className={`fa-solid ${icon} text-lg`} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">{title}</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export function SettingsPage() {
  const session = getSession()
  const role = session?.role ?? 'student'
  const { theme, setTheme } = useTheme()

  const [profile, setProfile] = useState<ApiUser | null>(null)

  // Profile form
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profileStatus, setProfileStatus] = useState<Status>('idle')
  const [profileError, setProfileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Navigation preference — collapsed sidebar state, mirrored to localStorage.
  const [navCollapsed, setNavCollapsedState] = useState<boolean>(() => getNavCollapsed())

  // Notifications preference (email updates), persisted to the account.
  const [emailNotif, setEmailNotif] = useState<boolean>(true)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus] = useState<Status>('idle')
  const [pwError, setPwError] = useState<string | null>(null)

  // On mount, hydrate every form from the server profile. Users who were on the
  // old floating-nav layout are migrated back to the sidebar (the floating bar
  // is no longer offered) and the preference is persisted.
  useEffect(() => {
    let cancelled = false
    getMe()
      .then((user) => {
        if (cancelled) return
        setProfile(user)
        setUsername(user.username ?? '')
        setFullName(user.full_name ?? '')
        setAvatarPreview(user.avatar_url ?? null)
        setNavCollapsedState(user.nav_collapsed ?? getNavCollapsed())
        setEmailNotif(user.email_notifications !== false)
        if (user.nav_style === 'floating') {
          setNavCollapsedState(false)
          setNavStyle('sidebar')
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setProfileStatus('error')
        setProfileError(
          err instanceof Error && err.message ? err.message : 'Could not load your profile.'
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  // File picker handler: validate size/type, resize + compress the image in the
  // browser (so the data URL stays under the API cap), then persist it so the
  // avatar survives reloads without a separate "Save profile" step.
  async function onAvatarSelected(file: File) {
    const validationError = validateAvatarFile(file)
    if (validationError) {
      setProfileStatus('error')
      setProfileError(validationError)
      return
    }
    setProfileStatus('saving')
    setProfileError(null)
    try {
      const resized = await resizeImage(file)
      setAvatarPreview(resized)
      const updated = await updateProfile({ avatar_url: resized })
      setProfile(updated)
      setProfileStatus('saved')
    } catch (err) {
      setProfileStatus('error')
      setProfileError(err instanceof Error ? err.message : 'Could not save your avatar.')
    }
  }

  // Persist username + display name via updateProfile(), then keep the returned
  // user as the source of truth.
  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (username.trim().length < 3) {
      setProfileStatus('error')
      setProfileError('Username must be at least 3 characters.')
      return
    }
    setProfileStatus('saving')
    setProfileError(null)
    try {
      const updated = await updateProfile({
        username: username.trim() || undefined,
        full_name: fullName.trim() || undefined,
      })
      setProfile(updated)
      setUsername(updated.username ?? '')
      setProfileStatus('saved')
    } catch (err) {
      setProfileStatus('error')
      setProfileError(err instanceof Error ? err.message : 'Could not save your profile.')
    }
  }

  // Collapsed-sidebar handler: update React state AND mirror into localStorage
  // so the layout reads it immediately, then persist to the account.
  function handleNavCollapsedChange(collapsed: boolean) {
    setNavCollapsedState(collapsed)
    setNavCollapsed(collapsed)
  }

  // Email-notification toggle: optimistic update + persist; revert on failure.
  async function handleEmailNotifChange(next: boolean) {
    const previous = emailNotif
    setEmailNotif(next)
    try {
      const updated = await updateProfile({ email_notifications: next })
      setProfile(updated)
      setProfileStatus('saved')
      setProfileError(null)
    } catch (err) {
      setEmailNotif(previous)
      setProfileStatus('error')
      setProfileError(err instanceof Error ? err.message : 'Could not update your preferences.')
    }
  }

  // Change-password flow: simple client-side validation (min length, match),
  // then calls the API and clears the pw fields on success.
  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword.length < 8) {
      setPwStatus('error')
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPwStatus('error')
      setPwError('New password needs a lowercase letter, an uppercase letter, and a number.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwStatus('error')
      setPwError('Passwords do not match.')
      return
    }
    setPwStatus('saving')
    setPwError(null)
    try {
      await changePassword(currentPassword, newPassword)
      setPwStatus('saved')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwStatus('error')
      setPwError(err instanceof Error ? err.message : 'Could not change your password.')
    }
  }

  // Sign out: revoke the server session, clear local auth state, hard-redirect.
  async function handleSignOut() {
    try {
      await logout()
    } finally {
      clearSession()
      window.location.assign('/auth')
    }
  }

  const navItems = navItemsFor(role) as DashboardNavItem[]

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your profile, appearance, navigation, and security"
      navItems={navItems}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Profile */}
        <SectionCard
          icon="fa-user-pen"
          title="Profile"
          description="Your name and profile picture appear across COURSER."
        >
          <form className="space-y-5" onSubmit={handleSaveProfile}>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-2 ring-stone-200 transition hover:ring-primary dark:bg-stone-800 dark:ring-stone-700 dark:hover:ring-primary-dark"
                aria-label="Upload profile picture"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <i className="fa-solid fa-user text-2xl text-stone-400" aria-hidden />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-stone-900/0 text-white opacity-0 transition group-hover:bg-stone-900/40 group-hover:opacity-100">
                  <i className="fa-solid fa-camera text-xl" aria-hidden />
                </span>
              </button>
              <div className="min-w-0">
                <p className="font-bold text-stone-900 dark:text-stone-50">{fullName || 'Your name'}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {profile?.email ?? '—'} · <span className="capitalize">{role.replace('_', ' ')}</span>
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  Upload picture
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onAvatarSelected(file)
                    e.currentTarget.value = ''
                  }}
                />
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={50}
                required
                autoComplete="username"
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Display name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </label>

            {profileStatus === 'error' ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{profileError}</p>
            ) : null}
            {profileStatus === 'saved' ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                <i className="fa-solid fa-circle-check mr-1" aria-hidden /> Profile updated.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={profileStatus === 'saving'}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
            >
              {profileStatus === 'saving' ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </SectionCard>

        {/* Appearance */}
        <SectionCard
          icon="fa-moon"
          title="Appearance"
          description="Switch between light and dark mode. Your choice is remembered on this device."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={[
                'flex items-center gap-3 rounded-xl border p-4 text-left transition',
                theme === 'light'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:bg-primary-dark/10'
                  : 'border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600',
              ].join(' ')}
            >
              <i className={`fa-solid fa-sun mt-0.5 ${theme === 'light' ? 'text-primary dark:text-primary-dark' : 'text-stone-400'}`} aria-hidden />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-50">Light</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Bright and crisp, best for daytime.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={[
                'flex items-center gap-3 rounded-xl border p-4 text-left transition',
                theme === 'dark'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30 dark:bg-primary-dark/10'
                  : 'border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600',
              ].join(' ')}
            >
              <i className={`fa-solid fa-moon mt-0.5 ${theme === 'dark' ? 'text-primary dark:text-primary-dark' : 'text-stone-400'}`} aria-hidden />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-50">Dark</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Easy on the eyes at night.</p>
              </div>
            </button>
          </div>
        </SectionCard>

        {/* Navigation */}
        <SectionCard
          icon="fa-table-columns"
          title="Navigation"
          description="The course workspace always uses the fixed side menu."
        >
          <div className="flex items-start gap-3 rounded-xl border border-primary bg-primary/5 p-4 ring-1 ring-primary/30 dark:bg-primary-dark/10">
            <i className="fa-solid fa-table-columns mt-0.5 text-primary dark:text-primary-dark" aria-hidden />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-50">Side menu</p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                A fixed sidebar you can collapse to icons.
              </p>
            </div>
          </div>

          <label className="mt-4 flex items-center justify-between rounded-xl border border-stone-200 bg-white/60 p-4 dark:border-stone-700 dark:bg-white/5">
            <div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-50">Start with the side menu collapsed</p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Show only icons until you expand it.</p>
            </div>
            <input
              type="checkbox"
              checked={navCollapsed}
              onChange={(e) => handleNavCollapsedChange(e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-primary focus:ring-primary"
            />
          </label>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon="fa-bell"
          title="Notifications"
          description="Choose what COURSER emails you about your learning."
        >
          <label className="flex items-center justify-between rounded-xl border border-stone-200 bg-white/60 p-4 dark:border-stone-700 dark:bg-white/5">
            <div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-50">Email updates</p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                Course news, new lessons, and account updates.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => handleEmailNotifChange(e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-primary focus:ring-primary"
            />
          </label>
        </SectionCard>

        {/* Security */}
        <SectionCard
          icon="fa-shield-halved"
          title="Security"
          description="Update your password. You'll stay signed in on this device."
        >
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <label className="block">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                />
              </label>
            </div>

            {pwStatus === 'error' ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{pwError}</p>
            ) : null}
            {pwStatus === 'saved' ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                <i className="fa-solid fa-circle-check mr-1" aria-hidden /> Password updated.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pwStatus === 'saving'}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-dark"
            >
              {pwStatus === 'saving' ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </SectionCard>

        {/* Account */}
        <SectionCard
          icon="fa-user-gear"
          title="Account"
          description="Your account details and session."
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60">
              <dt className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">Username</dt>
              <dd className="mt-1 font-bold text-stone-900 dark:text-stone-50">{profile?.username ?? session?.identifier ?? '—'}</dd>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60">
              <dt className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">Email</dt>
              <dd className="mt-1 truncate font-bold text-stone-900 dark:text-stone-50">{profile?.email ?? session?.email ?? '—'}</dd>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60">
              <dt className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">Role</dt>
              <dd className="mt-1 capitalize font-bold text-stone-900 dark:text-stone-50">{role.replace('_', ' ')}</dd>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60">
              <dt className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">Member since</dt>
              <dd className="mt-1 font-bold text-stone-900 dark:text-stone-50">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 inline-flex items-center rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <i className="fa-solid fa-right-from-bracket mr-2" aria-hidden />
            Sign out
          </button>
        </SectionCard>
      </div>
    </DashboardLayout>
  )
}