module.exports = {
  // Type check TypeScript files
  "**/*.(ts|tsx)": () => ["yarn tsc --noEmit", "yarn test -o --silent"],

  // Lint then format TypeScript and JavaScript files
  "**/*.(ts|tsx|js)": (filenames) => [
    `yarn lint --fix`,
    `yarn prettier --log-level warn --write ${filenames.join(" ")}`,
  ],

  // Format MarkDown and JSON
  "**/*.(md|json|yaml|yml)": (filenames) =>
    `yarn prettier --log-level warn --write ${filenames.join(" ")}`,
};
