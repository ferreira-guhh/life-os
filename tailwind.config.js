/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Isso aqui garante que o Tailwind procure em todas as pastas dentro de src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}