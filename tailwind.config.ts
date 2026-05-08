import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0A1628",
        "navy-2": "#0E1C32",
        surface: "#13243F",
        "surface-2": "#1B2E4D",
        "surface-3": "#243A5C",
        border: "#27395A",
        "border-2": "#36486B",
        text: "#F0F0F0",
        "text-2": "#A9B6CC",
        "text-3": "#6E7E96",
        accent: "#E8C84A",
        "accent-ink": "#1A1404",
        red: "#C8102E",
        positive: "#5BD08C",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
