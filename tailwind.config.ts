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
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: "#1e3a5f",
          dark: "#152a47",
        },
        teal: {
          DEFAULT: "#0d9488",
          light: "#ccfbf1",
        },
        orange: {
          DEFAULT: "#ea580c",
          light: "#ffedd5",
        },
        border: "#e2e8f0",
        surface: "#ffffff",
      },
    },
  },
  plugins: [],
};
export default config;
