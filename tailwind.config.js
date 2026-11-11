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
          dark: '#1C1C1C',      // Charcoal Black from Staffwyn palette
          darker: '#121212',
          card: '#FFFFFF',      // Crisp White surface
          surface: '#F6F3EA',   // Warm sand / cream secondary surface
          forest: '#1C1C1C',    // Charcoal pill active state
          forestLight: '#333333',
          cream: '#FAF6E8',     // Soft cream background
          creamMuted: '#71706B',
          creamDark: '#52514E',
          gold: '#F7D147',      // Warm Golden Yellow accent
          leaf: '#16A34A',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-red': 'flashRed 1s infinite alternate',
      },
      keyframes: {
        flashRed: {
          '0%': { backgroundColor: 'rgba(254, 226, 226, 0.7)', borderColor: 'rgba(239, 68, 68, 0.8)' },
          '100%': { backgroundColor: 'rgba(254, 202, 202, 0.95)', borderColor: 'rgba(220, 38, 38, 1)' },
        }
      }
    },
  },
  plugins: [],
}
