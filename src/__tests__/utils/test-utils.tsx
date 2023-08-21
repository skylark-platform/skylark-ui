import { DndContext } from "@dnd-kit/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LazyMotion, domMax } from "framer-motion";
import PlausibleProvider from "next-plausible";
import { ReactElement, ReactNode } from "react";

import { UserProvider } from "src/contexts/useUser";

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      // stub request errors in tests
      error: jest.fn(),
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <PlausibleProvider domain={""} enabled={false}>
        <UserProvider>
          <LazyMotion features={domMax}>{children}</LazyMotion>
        </UserProvider>
      </PlausibleProvider>
    </QueryClientProvider>
  );
};

const AllTheProvidersPlusDND = ({ children }: { children: ReactNode }) => {
  return (
    <AllTheProviders>
      <DndContext>{children}</DndContext>
    </AllTheProviders>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => ({
  user: userEvent.setup(),
  ...render(ui, { wrapper: AllTheProvidersPlusDND, ...options }),
});

// When checking text content, the DNDKit provider can confuse tests
const renderWithMinimalProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => ({
  user: userEvent.setup(),
  ...render(ui, { wrapper: AllTheProviders, ...options }),
});

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render, renderWithMinimalProviders };
