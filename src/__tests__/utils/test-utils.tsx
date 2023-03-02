import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions } from "@testing-library/react";
import { LazyMotion, domMax } from "framer-motion";
import PlausibleProvider from "next-plausible";
import { ReactElement, ReactNode } from "react";

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
        <LazyMotion features={domMax}>{children}</LazyMotion>
      </PlausibleProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
