module.exports = {
  plugins: [
    "@typescript-eslint",
    "jest",
    "no-relative-import-paths",
    "@tanstack/query",
  ],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended",
    "plugin:jest/recommended",
    "prettier",
  ],
  rules: {
    // Enforce Absolute Imports https://nextjs.org/docs/advanced-features/module-path-aliases
    "no-relative-import-paths/no-relative-import-paths": [
      "error",
      { allowSameFolder: true },
    ],
  },
  overrides: [
    {
      files: ["*.stories.*"],
      rules: {
        "import/no-anonymous-default-export": "off",
      },
    },
    {
      files: ["cypress/**"],
      rules: {
        "jest/expect-expect": "off",
        "no-relative-import-paths/no-relative-import-paths": "off",
      },
    },
  ],
};
