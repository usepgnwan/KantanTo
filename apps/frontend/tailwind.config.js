/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Struktur Flat agar @apply text-on-surface dkk bekerja
        'primary': 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        'primary-container': 'var(--primary-container)',

        'background': 'var(--background)',
        'on-background': 'var(--on-background)',

        'surface': 'var(--surface)',
        'on-surface': 'var(--on-surface)',
        'surface-low': 'var(--surface-low)',
        'surface-lowest': 'var(--surface-lowest)',
        'surface-container': 'var(--surface-container)',

        'border-color': 'var(--border-color)',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
