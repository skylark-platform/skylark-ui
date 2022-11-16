module.exports = {
  // Type check TypeScript files
  "**/*.(ts|tsx)": () => ["yarn tsc --noEmit", "yarn test -o"],

  // Lint then format TypeScript and JavaScript files
  "**/*.(ts|tsx|js)": (filenames) => [
    `yarn eslint --fix ${filenames.join(" ")}`,
    `yarn prettier --write ${filenames.join(" ")}`,
  ],

  // Format MarkDown and JSON
  "**/*.(md|json|yaml|yml)": (filenames) =>
    `yarn prettier --write ${filenames.join(" ")}`,
};
