/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'carmax-yellow': '#FDB71A',
        'carmax-blue': '#003E7E',
        'databricks-red': '#FF3621',
      },
    },
  },
  plugins: [],
}
