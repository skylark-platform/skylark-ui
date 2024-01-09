import { CheckedState } from "@radix-ui/react-checkbox";
import { useState, useMemo, useCallback } from "react";

import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

export type CheckedObjectState = {
  checkedState: CheckedState;
  object: ParsedSkylarkObject;
};

export const useCheckedObjectsState = (
  initialCheckedObjects?: CheckedObjectState[],
) => {
  const [checkedObjectsState, setCheckedObjectsState] = useState<
    CheckedObjectState[]
  >(initialCheckedObjects || []);

  const resetCheckedObjects = useCallback(() => {
    setCheckedObjectsState(initialCheckedObjects || []);
  }, [initialCheckedObjects]);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { checkedObjectTypes, checkedUids, checkedObjects } = useMemo(() => {
    const { objectTypes, uids, objects } = checkedObjectsState.reduce(
      (previous, { object, checkedState }) => {
        if (checkedState !== true) {
          return previous;
        }

        return {
          uids: [...previous.uids, object.uid],
          objectTypes: [...previous.objectTypes, object.objectType],
          objects: [...previous.objects, object],
        };
      },
      {
        uids: [] as string[],
        objectTypes: [] as string[],
        objects: [] as ParsedSkylarkObject[],
      },
    );

    return {
      checkedUids: uids,
      checkedObjectTypes: [...new Set(objectTypes)],
      checkedObjects: objects,
    };
  }, [checkedObjectsState]);

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
    checkedObjectsState,
    checkedObjects,
    checkedUids,
    checkedObjectTypes,
    checkedObjectTypesForDisplay,
    setCheckedObjectsState,
    resetCheckedObjects,
  };
};
