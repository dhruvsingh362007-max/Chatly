/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#C7D9EC',
          300: '#9FBFE0',
          400: '#6499CE',
          500: '#3D7AB8',
          600: '#2A5D96',
          700: '#1D4472',
          800: '#133054',
          900: '#0B192C',
          950: '#050D18',
        },
        slateSurface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

