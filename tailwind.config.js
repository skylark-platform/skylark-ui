/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: "Work Sans",
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "nav-bar": "#F0F2F6",
        black: "#0E1825",
        "brand-primary": "#226DFF",
      },
      transitionProperty: {
        width: "width",
      },
      animation: {
        "spin-fast": "spin 0.5s linear infinite",
      },
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#226DFF",
          "primary-content": "#FFF",
          secondary: "#D926A9",
          accent: "#1FB2A6",
          neutral: "#B8BCC6",
          "base-100": "#0E1825",
          "base-content": "#0E1825",
          info: "#C1E5FF",
          success: "#33BD6E",
          "success-content": "#FFF",
          "in-progress": "#FFBD12",
          pending: "#A8AFBD",
          "error-2": "#D83C28",
          warning: "#FBBD23",
          error: "#F43636",
          "error-content": "#FFF",
          disabled: "#226DFF",
          "--height-btn": "5rem",
        },
      },
    ],
  },
  plugins: [require("daisyui"), require("tailwindcss-radix")()],
};
