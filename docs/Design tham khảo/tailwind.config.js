/** tailwind.config.js — cấu hình khớp với AnkerGames reference */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,php,blade.php}",
    "./resources/**/*.blade.php",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" }, // ~ max-w-7xl
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "Inter-fallback", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--primary-color)", // 2563eb light / 2aa9e0 dark
        },
      },
      transitionDuration: { DEFAULT: "300ms" },
      aspectRatio: { poster: "2 / 3", hero: "1920 / 800" },
      height: { header: "64px" },
    },
  },
  plugins: [],
};
