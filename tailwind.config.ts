import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent colors used across the app
        brand: {
          orange: "#ff7a18",
          indigo: "#6366f1",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "blob-spin": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "float": {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "33%": { transform: "translate(14px, -18px)" },
          "66%": { transform: "translate(-12px, 12px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "50%": { transform: "translate(22px, 16px)" },
        },
      },
      animation: {
        "blob-spin": "blob-spin 8s ease-in-out infinite",
        "gradient-pan": "gradient-pan 6s ease infinite",
        "float": "float 16s ease-in-out infinite",
        "float-slow": "float-slow 26s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.5)",
        "glow-orange": "0 0 25px rgba(255, 122, 24, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
