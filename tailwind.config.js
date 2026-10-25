/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        '2xl': '1366px',
        '3xl': '1500px', // Guarantees 1920x1080 (which has viewport ~1536px-1903px) triggers 3xl
        '4xl': '1800px',
      },
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3daec',
          300: '#95bede',
          400: '#619ecb',
          500: '#3b82b6',
          600: '#1d5f99',
          700: '#194c7d',
          800: '#184167',
          900: '#183856',
          950: '#102439',
        }
      }
    },
  },
  plugins: [],
}
