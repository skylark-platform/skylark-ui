import { useRouter } from "next/router";
import { useCallback } from "react";

export const useSetContentModelSchemaVersion = () => {
  const { push, query } = useRouter();

  const setSchemaVersion = useCallback(
    (value: number, objectType?: string) => {
      push(
        `/content-model/${value}/${encodeURIComponent(objectType || query?.slug?.[1] || "")}`,
      );
    },
    [query],
  );

  return {
    setSchemaVersion,
  };
};
