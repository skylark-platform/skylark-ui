/** @type {import('ts-jest').JestConfigWithTsJest} */

process.env.TZ = "UTC";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "coverage",
        outputName: "jest-junit.xml",
        ancestorSeparator: " › ",
        uniqueOutputName: "false",
        suiteNameTemplate: "{filepath}",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
      },
    ],
  ],
  transform: {
    // Using a babel.config.js file disables the Next.js SWC replacement for babel
    // https://github.com/vercel/next.js/issues/30811#issuecomment-963102661
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: ["node_modules/(?!change-case)"],
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: [
    "__tests__/mocks",
    "__tests__/fixtures",
    "__tests__/utils",
  ],
};
