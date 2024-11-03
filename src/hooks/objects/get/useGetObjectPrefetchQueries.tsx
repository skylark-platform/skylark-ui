import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PanelTab } from "src/hooks/state";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

import { prefetchGetObjectAvailability } from "./useGetObjectAvailability";
import { prefetchGetObjectContent } from "./useGetObjectContent";

interface UseGetObjectPrefetchQueriesProps {
  uid: string;
  objectType: string;
  language: string;
  selectedTab: PanelTab;
}

export const useGetObjectPrefetchQueries = ({
  uid,
  objectType,
  language,
  selectedTab,
}: UseGetObjectPrefetchQueriesProps) => {
  const queryClient = useQueryClient();

  const { objects: allObjectsMeta } = useAllObjectsMeta(false);

  const objectMeta = allObjectsMeta?.find(({ name }) => name === objectType);

  const [isTabDataPrefetched, setIsTabDataPrefetched] = useState(false);

  useEffect(() => {
    if (objectMeta && allObjectsMeta && !isTabDataPrefetched) {
      const prefetchArgs = {
        queryClient,
        objectMeta,
        objectType,
        uid,
        variables: {
          uid,
          language,
          nextToken: "",
        },
      };

      if (objectMeta.hasAvailability && selectedTab !== PanelTab.Availability) {
        void prefetchGetObjectAvailability(prefetchArgs);
      }
      if (objectMeta.hasContent && selectedTab !== PanelTab.Content) {
        void prefetchGetObjectContent({
          ...prefetchArgs,
          contentObjectsMeta: allObjectsMeta,
        });
      }
      setIsTabDataPrefetched(true);
    }
  }, [
    allObjectsMeta,
    isTabDataPrefetched,
    language,
    objectMeta,
    objectType,
    queryClient,
    selectedTab,
    uid,
  ]);
};
