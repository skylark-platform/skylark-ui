import { DndContext } from "@dnd-kit/core";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/work-sans/700.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "motion/react";
import { initialize as initializeMsw, mswDecorator } from "msw-storybook-addon";
import PlausibleProvider from "next-plausible";
import "react-toastify/dist/ReactToastify.min.css";

import { handlers } from "../src/__tests__/mocks/handlers";
import { UserProvider } from "../src/contexts/useUser";
import "../src/styles/globals.css";

initializeMsw();

const queryClient = new QueryClient();

export const parameters = {
  // actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  // Global MSW handlers
  msw: {
    handlers: handlers,
  },
};

export const decorators = [
  mswDecorator,
  (Story) => {
    return (
      <QueryClientProvider client={queryClient}>
        <PlausibleProvider domain={""} enabled={false}>
          <DndContext>
            <UserProvider>
              <LazyMotion features={domMax}>
                <Story />
              </LazyMotion>
            </UserProvider>
          </DndContext>
        </PlausibleProvider>
      </QueryClientProvider>
    );
  },
];
export const tags = ["autodocs"];
