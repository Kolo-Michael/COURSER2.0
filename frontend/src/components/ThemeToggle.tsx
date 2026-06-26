import { useTheme } from '@/theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-slate-700 backdrop-blur transition hover:bg-white hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-accent-dark ${className}`}
    >
      <i
        className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-sm`}
        aria-hidden
      />
    </button>
  )
}