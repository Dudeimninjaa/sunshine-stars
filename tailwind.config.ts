import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        pop: {
          "0%": { transform: "scale(.7)", opacity: "0" },
          "55%": { transform: "scale(1.18)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        floatUp: {
          "0%": { transform: "translateY(28px) scale(.65) rotate(-8deg)", opacity: "0" },
          "18%": { opacity: "1" },
          "45%": { transform: "translateY(-20px) scale(1.35) rotate(5deg)", opacity: "1" },
          "100%": { transform: "translateY(-95px) scale(1.75) rotate(-4deg)", opacity: "0" }
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(250, 204, 21, 0)", transform: "scale(1)" },
          "35%": { boxShadow: "0 0 55px rgba(250, 204, 21, .95)", transform: "scale(1.05)" },
          "65%": { boxShadow: "0 0 35px rgba(251, 146, 60, .85)", transform: "scale(1.02)" }
        },
        sparkle: {
          "0%": { transform: "translateY(18px) scale(.7)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateY(-85px) scale(1.6)", opacity: "0" }
        },
        bannerPop: {
          "0%": { transform: "translate(-50%, -40%) scale(.6)", opacity: "0" },
          "30%": { transform: "translate(-50%, -50%) scale(1.08)", opacity: "1" },
          "100%": { transform: "translate(-50%, -50%) scale(1)", opacity: "1" }
        }
      },
      animation: {
        pop: "pop .28s ease-out",
        floatUp: "floatUp 1.35s cubic-bezier(.16,1,.3,1) forwards",
        glow: "glow 1.05s ease-in-out",
        sparkle: "sparkle 1.15s ease-out forwards",
        bannerPop: "bannerPop .45s ease-out forwards"
      }
    },
  },
  plugins: [],
};
export default config;
