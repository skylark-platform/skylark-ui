import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/work-sans/700.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { initialize as initializeMsw, mswDecorator } from "msw-storybook-addon";
import PlausibleProvider from "next-plausible";
import "react-toastify/dist/ReactToastify.min.css";

import {
  getObjectAvailabilityHandlers,
  getObjectHandlers,
} from "../src/__tests__/mocks/handlers/getObjectHandlers";
import { introspectionHandlers } from "../src/__tests__/mocks/handlers/introspectionHandlers";
import { searchHandlers } from "../src/__tests__/mocks/handlers/searchHandlers";
import { updateObjectHandlers } from "../src/__tests__/mocks/handlers/updateObjectHandlers";
import "../src/styles/globals.css";

initializeMsw();

const queryClient = new QueryClient();

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  // Global MSW handlers
  msw: {
    handlers: {
      introspection: introspectionHandlers,
      search: searchHandlers,
      getObject: getObjectHandlers,
      getObjectAvailability: getObjectAvailabilityHandlers,
      updateObject: updateObjectHandlers,
    },
  },
};

export const decorators = [
  mswDecorator,
  (Story) => {
    return (
      <QueryClientProvider client={queryClient}>
        <PlausibleProvider domain={""} enabled={false}>
          <LazyMotion features={domMax}>
            <Story />
          </LazyMotion>
        </PlausibleProvider>
      </QueryClientProvider>
    );
  },
];
