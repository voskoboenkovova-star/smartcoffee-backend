/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          500: '#8c6239',
          600: '#734d26',
          800: '#422517',
          900: '#2b140a',
        }
      }
    },
  },
  plugins: [],
}