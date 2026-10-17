import type { Config } from "tailwindcss";

/** Every brand colour resolves through a CSS variable so the Settings → Theme customizer can restyle the app live. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rose: {
          50: "color-mix(in srgb, var(--color-bg) 20%, #fff)",
          100: "color-mix(in srgb, var(--color-bg) 50%, #fff)",
          200: "var(--color-bg)",
          300: "color-mix(in srgb, var(--color-primary) 60%, #fff)",
          400: "color-mix(in srgb, var(--color-primary) 80%, #fff)",
          500: "var(--color-primary)",
          600: "color-mix(in srgb, var(--color-primary) 88%, #000)",
          700: "var(--color-primary-dark)",
        },
        sage: {
          50: "color-mix(in srgb, var(--color-bg) 20%, #fff)",
          100: "color-mix(in srgb, var(--color-primary) 16%, #fff)",
          200: "color-mix(in srgb, var(--color-primary) 28%, #fff)",
          500: "var(--color-primary)",
          600: "var(--color-primary)",
          700: "var(--color-primary-dark)",
        },
        honey: { 400: "var(--color-accent)", 700: "color-mix(in srgb, var(--color-accent) 55%, #000)" },
        brass: {
          100: "color-mix(in srgb, var(--color-highlight) 25%, #fff)",
          300: "color-mix(in srgb, var(--color-highlight) 70%, #fff)",
          400: "var(--color-highlight)",
          700: "color-mix(in srgb, var(--color-highlight) 50%, #000)",
        },
        onprimary: "var(--on-primary)",
        onhl: "var(--on-highlight)",
      },
    },
  },
  plugins: [],
};
export default config;
