import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "kztpw9",
  e2e: {
    baseUrl: "http://localhost:3000",
  },
  chromeWebSecurity: false, // Allow accessing iframes
});
