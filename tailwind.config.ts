import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fafbfc",
        surface: "#ffffff",
        border: "#e5e7eb",
        navy: {
          DEFAULT: "#0f2a47",
          dark: "#081a30",
          light: "#1e3a5f",
        },
        brand: {
          orange: "#f97316",
          "orange-dark": "#ea580c",
          "orange-light": "#fed7aa",
          teal: "#0d9488",
          "teal-light": "#ccfbf1",
        },
        success: "#16a34a",
        warning: "#f59e0b",
        error: "#dc2626",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 42 71 / 0.04), 0 1px 2px -1px rgb(15 42 71 / 0.04)",
        "card-hover":
          "0 4px 12px -2px rgb(15 42 71 / 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
