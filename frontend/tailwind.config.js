/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: "#070b14",
        slateGlow: "#121a2b",
        cyanEdge: "#31d7ff",
        mint: "#7fffd4",
        amberSoft: "#ffc66b"
      },
      boxShadow: {
        glass: "0 8px 24px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        floatIn: "floatIn 0.5s ease forwards"
      }
    }
  },
  plugins: []
};
