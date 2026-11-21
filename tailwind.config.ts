import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "Tajawal", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        brand: "var(--brand)",
        "brand-2": "var(--brand-2)",
        ink: "var(--ink)",
      },
      boxShadow: {
        soft: "0 6px 24px -10px rgba(15, 23, 42, 0.12)",
        card: "0 2px 16px -6px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .5s ease both",
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
