/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./src/**/*.{vue,js,ts,jsx,tsx,html}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#10b981',
      }
    },
  },
  plugins: [],
}
