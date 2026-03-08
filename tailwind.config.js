/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",        // Root folder ထဲက ဖိုင်တွေအတွက် (ဥပမာ: App.jsx, main.jsx)
    "./src/**/*.{js,ts,jsx,tsx}", // src folder ထဲက ဖိုင်တွေအတွက်
    "./components/**/*.{js,ts,jsx,tsx}" // components folder သုံးခဲ့ရင်
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
