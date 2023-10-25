module.exports = {
  trailingComma: "all",
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  importOrder: ["<THIRD_PARTY_MODULES>", "src/", "public/", "^[./]"],
  importOrderSeparation: true,
  plugins: ['prettier-plugin-tailwindcss', "@trivago/prettier-plugin-sort-imports"],
};
