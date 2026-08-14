// ─── PublicShell.tsx : layout for public / logged-out pages ─────────────
// Minimal vertical shell wrapping page content with the marketing header
// and footer. Used by landing, auth, and catalog pages.
import type { ReactNode } from 'react'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

type PublicShellProps = {
  children: ReactNode
}

/** Renders children between the site header and footer, flex-filling. */
export function PublicShell({ children }: PublicShellProps) {
  // AnimatedBackground was removed — the body bg in index.css is the
  // single solid surface for the whole app.
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
