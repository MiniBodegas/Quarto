/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#074BED',
        secondary: '#6C757D',
        background: '#F8F9FA',
        card: '#FFFFFF',
        border: '#DEE2E6',
        'text-primary': '#212529',
        'text-secondary': '#6C757D',
      },
    },
  },
  plugins: [],
}