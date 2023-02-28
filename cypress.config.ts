import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "kztpw9",
  e2e: {
    baseUrl: "http://localhost:3000",
  },
  env: {
    // Used to intercept network requests
    skylark_graphql_uri: "http://localhost:9999/graphql",
  },
  fixturesFolder: "./src/tests/fixtures",
  chromeWebSecurity: false, // Allow accessing iframes
});
