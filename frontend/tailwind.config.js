/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          900: '#070b14',
          850: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          neon: '#06b6d4',
          accent: '#38bdf8',
          danger: '#ef4444',
          warning: '#f59e0b',
          safe: '#10b981'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.8, filter: 'drop-shadow(0 0 15px rgba(6,182,212,0.4))' },
          '50%': { opacity: 1, filter: 'drop-shadow(0 0 25px rgba(6,182,212,0.8))' },
        }
      }
    },
  },
  plugins: [],
}
