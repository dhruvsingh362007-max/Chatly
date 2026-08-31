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
        chatly: {
          bg: '#09090b',        // Pure dark background
          surface: '#121215',   // Slightly elevated surface
          card: '#18181b',      // Card surface
          cardHover: '#202024', // Card hover state
          border: '#27272a',    // Subtle clean border
          borderSubtle: '#1f1f23',
          borderActive: '#3f3f46',
          primary: '#ffffff',   // Crisp white primary text/accents
          secondary: '#e4e4e7', // Off-white secondary
          muted: '#a1a1aa',     // Muted gray text
          subtle: '#71717a',    // Subtle gray
        }
      },
      animation: {
        'radar-sweep': 'sweep 5s linear infinite',
        'subtle-pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'modal': '0 20px 40px -15px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
}
