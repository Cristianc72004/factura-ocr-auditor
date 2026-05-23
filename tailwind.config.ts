import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        navy: "#13233f",
        steel: "#475569",
        line: "#d8dee8",
        surface: "#f6f8fb",
        approved: "#087f5b",
        observed: "#b7791f",
        rejected: "#b42318"
      },
      boxShadow: {
        subtle: "0 12px 30px rgba(15, 23, 42, 0.08)"
      }
    },
  },
  plugins: [],
};

export default config;
