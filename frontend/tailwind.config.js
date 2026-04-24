/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(222 47% 45%)",
          foreground: "hsl(0 0% 100%)",
        },
        sidebar: {
          DEFAULT: "hsl(222 20% 14%)",
          foreground: "hsl(210 40% 92%)",
          border: "hsl(222 15% 20%)",
          accent: "hsl(222 15% 22%)",
          "accent-foreground": "hsl(210 40% 98%)",
          primary: "hsl(222 47% 55%)",
          "primary-foreground": "hsl(0 0% 100%)",
        },
      },
    },
  },
  plugins: [],
};
