import type { ReactNode } from 'react'
import { AnimatedBackground } from '@/components/landing/AnimatedBackground'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

type PublicShellProps = {
  children: ReactNode
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnimatedBackground />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
