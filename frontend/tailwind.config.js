/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          // Slightly cooler/lighter blue for dark mode surfaces
          dark: '#3B82F6',
        },
        accent: {
          DEFAULT: '#F97316',
          // Brighter orange so it pops on dark surfaces
          dark: '#FB923C',
        },
      },
      // Animations live only on the ThemeToggle transition; everything
      // else is static. The previous `animate-blob` keyframes were
      // dropped along with `AnimatedBackground.tsx` / `StudyAnimation.tsx`.
    },
  },
  plugins: [],
}
