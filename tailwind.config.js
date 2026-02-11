/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFFBF0",
        primary: "#FF8C76",
        text: "#333333",
        inactive: "#E0E0E0",
      },
      fontFamily: {
        sans: ["Nunito_400Regular"],
        bold: ["Nunito_700Bold"],
        semibold: ["Nunito_600SemiBold"],
      }
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}
