import { ReactNode } from "react";
import { InView } from "react-intersection-observer";

import { Spinner } from "src/components/icons";

interface PanelLoadingProps {
  loadMore?: () => void;
  isLoading?: boolean;
  children?: ReactNode;
}

export const PanelLoading = ({
  loadMore,
  isLoading,
  children,
}: PanelLoadingProps) => (
  <InView as="div" onChange={(inView) => inView && loadMore?.()}>
    {isLoading && (
      <div data-chromatic="ignore" data-testid="loading" className="w-full">
        {children || (
          <div
            data-chromatic="ignore"
            className="flex w-full items-center justify-center py-10"
          >
            <Spinner className="h-10 w-10 animate-spin md:h-14 md:w-14" />
          </div>
        )}
      </div>
    )}
  </InView>
);
