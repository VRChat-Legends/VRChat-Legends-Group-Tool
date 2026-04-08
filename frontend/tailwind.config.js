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
          dark: '#0A0A0A',
          darker: '#050505',
          purple: '#6B46C1',
          'purple-light': '#805AD5',
          pink: '#FF007A',
          'pink-light': '#FF33A1',
          cyan: '#00B7EB',
        },
        brand: {
          50: '#f0f1ff',
          100: '#e0e4ff',
          200: '#c7cdff',
          300: '#a4adff',
          400: '#7d85ff',
          500: '#5c5cf6',
          600: '#4b46e8',
          700: '#3f3ad4',
          800: '#3632ac',
          900: '#302e87',
          950: '#1e1c4b',
        },
        surface: {
          50: '#f8fafc',
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
        'aurora': 'aurora 20s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1) translate(0, 0)' },
          '33%': { opacity: '0.6', transform: 'scale(1.1) translate(2%, 2%)' },
          '66%': { opacity: '0.5', transform: 'scale(1.05) translate(-1%, -1%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(92, 92, 246, 0.4)',
        'glow-lg': '0 0 60px -15px rgba(92, 92, 246, 0.5)',
      },
    },
  },
  plugins: [],
}
