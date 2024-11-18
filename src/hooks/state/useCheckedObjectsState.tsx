import { CheckedState } from "@radix-ui/react-checkbox";
import { useState, useMemo, useCallback } from "react";

import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObject } from "src/interfaces/skylark";

export type CheckedObjectState = {
  checkedState: CheckedState;
  object: SkylarkObject;
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

  const { objectTypesConfig } = useSkylarkObjectTypesWithConfig();

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
        objects: [] as SkylarkObject[],
      },
    );

    return {
      checkedUids: uids,
      checkedObjectTypes: [...new Set(objectTypes)],
      checkedObjects: objects,
    };
  }, [checkedObjectsState]);

  const checkedObjectTypesForDisplay = useMemo(() => {
    const objectTypesForDisplay = objectTypesConfig
      ? checkedObjectTypes.map((objectType) => {
          const config = objectTypesConfig?.[objectType];

          return config?.objectTypeDisplayName || objectType;
        })
      : checkedObjectTypes;

    return objectTypesForDisplay;
  }, [checkedObjectTypes, objectTypesConfig]);

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
