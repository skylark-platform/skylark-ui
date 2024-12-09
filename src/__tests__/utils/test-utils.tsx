import { DndContext } from "@dnd-kit/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LazyMotion, domMax } from "motion/react";
import PlausibleProvider from "next-plausible";
import { ReactElement, ReactNode } from "react";
import { ToastContainer } from "react-toastify";

import introspectionQuery from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";
import { UserProvider } from "src/contexts/useUser";

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <PlausibleProvider domain={""} enabled={false}>
        <UserProvider>
          <LazyMotion features={domMax}>
            <ToastContainer />
            {children}
          </LazyMotion>
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

export const allObjectTypes = introspectionQuery.data.__schema.types
  .find((type) => type.name === "VisibleObject")
  ?.possibleTypes?.map(({ name }) => name) as string[];

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render, renderWithMinimalProviders };
