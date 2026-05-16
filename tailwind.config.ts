import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#07080d",
        steel: "#10131d",
        frost: "rgba(255,255,255,0.08)",
        pulse: "#4df3ff",
        volt: "#b7ff5a",
        coral: "#ff6b6b"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 70px rgba(77, 243, 255, 0.18)",
        soft: "0 24px 90px rgba(0, 0, 0, 0.35)"
      },
      backgroundImage: {
        "premium-radial": "radial-gradient(circle at 18% 12%, rgba(77,243,255,0.18), transparent 28%), radial-gradient(circle at 82% 4%, rgba(183,255,90,0.13), transparent 24%), linear-gradient(135deg, #07080d 0%, #121522 52%, #090a10 100%)"
      }
    }
  },
  plugins: []
};

export default config;
