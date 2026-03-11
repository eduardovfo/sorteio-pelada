import type { Config } from "tailwindcss";

const config: Config = {
  // dark:bg-*, dark:text-* etc. aplicam quando há .dark em um ancestral (ex.: <html class="dark">)
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // Referência: Dark → bg-slate-950, bg-slate-900, border-slate-800, text-slate-100
      // Light → bg-gray-50, bg-white, border-gray-200, text-gray-900
      colors: {
        primary: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff"
        },
        accent: {
          DEFAULT: "#0369a1",
          foreground: "#e0f2fe"
        }
      },
      borderRadius: {
        xl: "1.2rem"
      },
      boxShadow: {
        "soft-card": "0 18px 40px rgba(15, 23, 42, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;

