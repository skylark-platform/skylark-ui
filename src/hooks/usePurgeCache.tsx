import { useMutation } from "@tanstack/react-query";

import { SkylarkObject, SkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createPurgeObjectTypesCacheMutation } from "src/lib/graphql/skylark/dynamicMutations/cache";
import {
  PURGE_CACHE_ALL,
  PURGE_CACHE_OBJECT_TYPE,
} from "src/lib/graphql/skylark/mutations";
import { hasProperty } from "src/lib/utils";

export const usePurgeCacheAll = ({ onSuccess }: { onSuccess: () => void }) => {
  const { mutate: purgeCache } = useMutation({
    mutationKey: ["purgeCache"],
    mutationFn: () => skylarkRequest("mutation", PURGE_CACHE_ALL, {}, {}),
    onSuccess: () => {
      onSuccess();
    },
    // eslint-disable-next-line no-console
    onError: console.error,
  });

  return { purgeCache };
};

export const usePurgeCacheObjectType = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) => {
  const { mutate: purgeCache } = useMutation({
    mutationKey: ["purgeCache"],
    mutationFn: ({
      objectType,
      uids,
    }: {
      objectType: SkylarkObjectType;
      uids?: string[];
    }) =>
      skylarkRequest(
        "mutation",
        PURGE_CACHE_OBJECT_TYPE,
        { objectType, uids },
        {},
      ),
    onSuccess: () => {
      onSuccess();
    },
    // eslint-disable-next-line no-console
    onError: (err) => onError(err),
  });

  return { purgeCache };
};

const groupObjectsByObjectType = (
  objects: SkylarkObject[],
): Record<SkylarkObjectType, string[]> => {
  return objects.reduce(
    (prev, { objectType, uid }) => {
      return {
        ...prev,
        [objectType]: hasProperty(prev, objectType)
          ? [...prev[objectType], uid]
          : [uid],
      };
    },
    {} as Record<SkylarkObjectType, string[]>,
  );
};

export const usePurgeObjectsCache = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) => {
  const { mutate: purgeCacheForObjects } = useMutation({
    mutationKey: ["purgeCache"],
    mutationFn: (objects: SkylarkObject[]) => {
      const purgeConfiguration = groupObjectsByObjectType(objects);
      return skylarkRequest(
        "mutation",
        createPurgeObjectTypesCacheMutation(purgeConfiguration),
        {},
        {},
      );
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => onError(err),
  });

  return { purgeCacheForObjects };
};
