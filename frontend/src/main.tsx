import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './theme'
import './index.css'

// Apply theme class before paint to avoid a light/dark flash.
;(function bootstrapTheme() {
  const stored = window.localStorage.getItem('courser.theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light'
  if (theme === 'dark') document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = theme
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)