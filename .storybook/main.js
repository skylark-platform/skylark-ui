const path = require("path");

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    // {
    //   name: "storybook-addon-next",
    //   options: {
    //     nextConfigPath: path.resolve(__dirname, "../next.config.js"),
    //   },
    // },
  ],

  framework: {
    name: "@storybook/nextjs", // Add this
    options: {
      nextConfigPath: path.resolve(__dirname, "../next.config.js"),
    },
  },

  // core: {
  //   builder: "webpack5",
  // },
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
