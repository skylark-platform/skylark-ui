import { useState, useMemo } from "react";

import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

export const useCheckedObjectsState = () => {
  const [checkedObjects, setCheckedObjects] = useState<ParsedSkylarkObject[]>(
    [],
  );

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { checkedObjectTypes, checkedUids } = useMemo(() => {
    const { objectTypes, uids } = checkedObjects.reduce(
      (previous, { uid, objectType }) => {
        return {
          uids: [...previous.uids, uid],
          objectTypes: [...previous.objectTypes, objectType],
        };
      },
      {
        uids: [] as string[],
        objectTypes: [] as string[],
      },
    );

    return {
      checkedUids: uids,
      checkedObjectTypes: [...new Set(objectTypes)],
    };
  }, [checkedObjects]);

  const checkedObjectTypesForDisplay = useMemo(() => {
    const objectTypesForDisplay = objectTypesWithConfig
      ? checkedObjectTypes.map((objectType) => {
          const data = objectTypesWithConfig.find(
            (c) => c.objectType === objectType,
          );

          return data?.config?.objectTypeDisplayName || objectType;
        })
      : checkedObjectTypes;

    return objectTypesForDisplay;
  }, [checkedObjectTypes, objectTypesWithConfig]);

  return {
    checkedObjects,
    checkedUids,
    checkedObjectTypes,
    checkedObjectTypesForDisplay,
    setCheckedObjects,
  };
};
