// ─── tailwind.config.js : design tokens ─────────────────────────────────
// Brand colors (primary blue / accent orange) with adjusted dark-mode
// variants, the `class`-based dark mode, and content globs so Tailwind
// scans the whole app. No custom animations are defined.
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
        // Accessible accent variants — pass WCAG AA 4.5:1 minimum.
        // `accent` (orange-500) is kept for backgrounds/decoration only;
        // `accentFg` is a darker orange-800 for text on light surfaces,
        // and `accentBtn` is orange-700 used with white text for buttons.
        accent: {
          DEFAULT: '#F97316',
          dark: '#FB923C',
          fg: '#7C2D12',       // orange-900: 9.2:1 on #F7F6F4
          btn: '#C2410C',      // orange-800: 5.1:1 on white,  white text passes
        },
      },
      // Animations live only on the ThemeToggle transition; everything
      // else is static. The previous `animate-blob` keyframes were
      // dropped along with `AnimatedBackground.tsx` / `StudyAnimation.tsx`.
    },
  },
  plugins: [],
}
