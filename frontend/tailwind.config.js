/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        vrcl: {
          dark:          '#05050a',
          darker:        '#030305',
          purple:        '#6d4aff',
          'purple-light':'#8b5cf6',
          pink:          '#f43f93',
          'pink-light':  '#f472b6',
          cyan:          '#22d3ee',
        },
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d4aff',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      animation: {
        'aurora':  'aurora 20s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1) translate(0, 0)' },
          '33%':      { opacity: '0.6', transform: 'scale(1.1) translate(2%, 2%)' },
          '66%':      { opacity: '0.5', transform: 'scale(1.05) translate(-1%, -1%)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      boxShadow: {
        'glow':    '0 0 40px -10px rgba(109, 74, 255, 0.45)',
        'glow-lg': '0 0 60px -15px rgba(109, 74, 255, 0.55)',
        'glow-sm': '0 0 20px -8px rgba(109, 74, 255, 0.35)',
        'pink':    '0 0 40px -10px rgba(244, 63, 147, 0.35)',
      },
    },
  },
  plugins: [],
}
