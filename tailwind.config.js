/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          dark: '#02110c',      // Dark Emerald Green from Pinterest palette
          darker: '#010906',
          card: '#081d15',      // Elevated surface
          surface: '#0d281e',   // Surface element
          forest: '#1a422f',    // Olive/Forest Green from Pinterest palette
          forestLight: '#265e43',
          cream: '#f3ebd6',     // Cream Beige from Pinterest palette
          creamMuted: '#d5cbbb',
          creamDark: '#b8ac97',
          gold: '#dfc499',
          leaf: '#2ea06e',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-red': 'flashRed 1s infinite alternate',
      },
      keyframes: {
        flashRed: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.8)' },
          '100%': { backgroundColor: 'rgba(239, 68, 68, 0.35)', borderColor: 'rgba(220, 38, 38, 1)' },
        }
      }
    },
  },
  plugins: [],
}
