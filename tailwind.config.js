/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFF9F0",
        primary: "#FF9E7D",
        card: "#FFFFFF",
        text: "#333333",
        muted: "#7F7F7F",
        inactive: "#E0E0E0",
        secondary: "#fff1dbff",
        "tip-bg": "#fffff9ff",
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
