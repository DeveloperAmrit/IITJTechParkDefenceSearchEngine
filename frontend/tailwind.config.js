/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "chat-bg": "#212121",
        "chat-sidebar": "#171717",
        "chat-input": "#2f2f2f",
        "chat-hover": "#2f2f2f",
        "chat-border": "#424242",
        "chat-text": "#ececec",
        "chat-text-secondary": "#9b9b9b",
        "chat-accent": "#10a37f",
        "chat-user-bg": "#2f2f2f",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#ececec",
            a: { color: "#10a37f" },
            strong: { color: "#ececec" },
            h1: { color: "#ececec" },
            h2: { color: "#ececec" },
            h3: { color: "#ececec" },
            h4: { color: "#ececec" },
            code: { color: "#ececec" },
            blockquote: { color: "#9b9b9b" },
            "ol > li::marker": { color: "#9b9b9b" },
            "ul > li::marker": { color: "#9b9b9b" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
