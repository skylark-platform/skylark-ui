const path = require("path");

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/nextjs", // Add this
    options: {
      nextConfigPath: path.resolve(__dirname, "../next.config.js"),
    },
  },
  staticDirs: ["../public"],
  env: (config) => ({
    ...config,
    NEXT_PUBLIC_SAAS_API_ENDPOINT: "http://localhost:6006",
    NEXT_PUBLIC_SAAS_API_KEY: "token",
  }),
  docs: {
    autodocs: true,
  },
};
