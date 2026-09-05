/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          blue: "#2563eb",
          "blue-dark": "#1d4ed8",
          "blue-light": "#eff6ff",
          sapphire: "#1e3a8a",
          surface: "#ffffff",
          bg: "#f8fafc",
          border: "#e2e8f0",
        }
      },
      screens: {
        'xs': '475px',
      }
    },
  },
  plugins: [],
}
