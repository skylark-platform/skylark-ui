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
        manatee: {
          50: "#F6F8FB",
          100: "#F1F3F7",
          200: "#E6E9EF",
          300: "#BFC5CF",
          400: "#A8AFBD",
          500: "#8D96A7",
          600: "#6B7587",
          700: "#4E5868",
          800: "#2F3948",
          900: "#0E1825",
        },
        ultramarine: {
          50: "#E2F2FF",
          100: "#C1E5FF",
          500: "#3994FF",
          600: "#226DFF",
          700: "#1952D1",
          800: "#113491",
          900: "#0E204F",
        },
      },
      transitionProperty: {
        width: "width",
      },
      animation: {
        "spin-fast": "spin 0.5s linear infinite",
      },
      minWidth: (theme) => ({
        24: theme("spacing.24"),
      }),
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
          "base-100": "#FFFFFF",
          "base-content": "#0E1825",
          info: "#C1E5FF",
          success: "#33BD6E",
          "success-content": "#FFF",
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
