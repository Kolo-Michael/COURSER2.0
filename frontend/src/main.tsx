// ─── main: app bootstrap ────────────────────────────────────────────────────
// Entry point. Applies the saved/system theme before first paint (to avoid a
// light/dark flash), then mounts the React tree wrapped in ThemeProvider (for
// Tailwind's dark variant) and BrowserRouter (for client-side routing).

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './theme'
import './index.css'

// Apply theme class before paint to avoid a light/dark flash.
;(function bootstrapTheme() {
  // theme = saved localStorage value if valid, else follow the OS preference.
  const stored = window.localStorage.getItem('courser.theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light'
  // "dark" class flips Tailwind's dark: variants; colorScheme fixes dark scrollbars/form controls.
  if (theme === 'dark') document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = theme
})()

// Mount the root <App /> into #root. StrictMode catches side effects in dev.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)