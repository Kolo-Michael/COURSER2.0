import type { ReactNode } from 'react'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

type PublicShellProps = {
  children: ReactNode
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
