/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        inactive: "rgb(var(--inactive) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        "tip-bg": "rgb(var(--tip-bg) / <alpha-value>)",
      },
      fontFamily: {
        "q-regular": ["Quicksand_400Regular"],
        "q-medium": ["Quicksand_500Medium"],
        "q-semibold": ["Quicksand_600SemiBold"],
        "q-bold": ["Quicksand_700Bold"],
      }
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}
