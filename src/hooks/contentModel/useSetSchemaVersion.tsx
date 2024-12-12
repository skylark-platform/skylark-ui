import { useRouter } from "next/router";
import { useCallback } from "react";

export const useSetContentModelSchemaVersion = () => {
  const { push, query } = useRouter();

  const setSchemaVersion = useCallback(
    (value: number) => {
      push(`/content-model/${value}/${query?.slug?.[1] || ""}`);
    },
    [query],
  );

  return {
    setSchemaVersion,
  };
};
