import { MockedProvider } from "@apollo/client/testing";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/work-sans/700.css";
import "react-toastify/dist/ReactToastify.min.css";

import "../src/styles/globals.css";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  apolloClient: {
    MockedProvider,
  },
};
