import { InView } from "react-intersection-observer";

import { Spinner } from "src/components/icons";

interface PanelLoadingProps {
  loadMore: () => void;
  isLoading?: boolean;
}

export const PanelLoading = ({ loadMore, isLoading }: PanelLoadingProps) => (
  <InView as="div" onChange={(inView) => inView && loadMore()}>
    {isLoading && (
      <div
        data-chromatic="ignore"
        className="flex w-full items-center justify-center py-10"
      >
        <Spinner className="h-10 w-10  animate-spin md:h-14 md:w-14" />
      </div>
    )}
  </InView>
);
