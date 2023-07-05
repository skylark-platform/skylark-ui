import { useState, useMemo } from "react";

import { ParsedSkylarkObject } from "src/interfaces/skylark";

export const useCheckedObjectsState = () => {
  const [checkedObjects, setCheckedObjects] = useState<ParsedSkylarkObject[]>(
    [],
  );
  const { checkedObjectTypes, checkedUids } = useMemo(() => {
    const { objectTypes, uids } = checkedObjects.reduce(
      (previous, { uid, config, objectType }) => {
        return {
          uids: [...previous.uids, uid],
          objectTypes: [
            ...previous.objectTypes,
            config.objectTypeDisplayName || objectType,
          ],
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

  return {
    checkedObjects,
    checkedUids,
    checkedObjectTypes,
    setCheckedObjects,
  };
};
