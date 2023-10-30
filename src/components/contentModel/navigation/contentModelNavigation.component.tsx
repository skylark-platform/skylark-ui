import clsx from "clsx";
import { useEffect } from "react";

import {
  useSkylarkSetObjectTypes,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObjectConfig } from "src/interfaces/skylark";
import { isSkylarkObjectType } from "src/lib/utils";

interface ObjectTypeNavigationProps {
  activeObjectType: string | null;
  setObjectType: (objectType: string) => void;
}

const ObjectTypeNavigationSection = ({
  title,
  activeObjectType,
  objectTypesWithConfig,
  setObjectType,
}: {
  title: string;
  activeObjectType: string | null;
  objectTypesWithConfig: {
    objectType: string;
    config: ParsedSkylarkObjectConfig;
  }[];
  setObjectType: (objectType: string) => void;
}) => (
  <div className="flex flex-col justify-start items-start my-4">
    <p className="mb-1 font-medium text-lg">{title}</p>
    {objectTypesWithConfig?.map(({ objectType, config }) => {
      return (
        <button
          key={objectType}
          className={clsx(
            "my-1 flex items-center",
            activeObjectType === objectType
              ? "text-black font-medium"
              : "text-manatee-600",
          )}
          onClick={() => setObjectType(objectType)}
        >
          <span
            className="w-4 h-4 block rounded mr-1"
            style={{ backgroundColor: config.colour || undefined }}
          />
          {config.objectTypeDisplayName &&
          config.objectTypeDisplayName !== objectType ? (
            <>
              {objectType}{" "}
              <span className="text-manatee-400 font-normal ml-1">
                ({config.objectTypeDisplayName})
              </span>
            </>
          ) : (
            objectType
          )}
        </button>
      );
    })}
  </div>
);

export const ObjectTypeNavigation = ({
  activeObjectType,
  setObjectType,
}: ObjectTypeNavigationProps) => {
  const { setObjectTypes } = useSkylarkSetObjectTypes(true);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const setObjectTypesWithConfig = objectTypesWithConfig?.filter(
    ({ objectType }) => setObjectTypes?.includes(objectType),
  );
  const systemObjectTypesWithConfig = objectTypesWithConfig?.filter(
    ({ objectType }) =>
      isSkylarkObjectType(objectType) && !setObjectTypes?.includes(objectType),
  );
  const customObjectTypesWithConfig = objectTypesWithConfig?.filter(
    ({ objectType }) =>
      !isSkylarkObjectType(objectType) && !setObjectTypes?.includes(objectType),
  );

  useEffect(() => {
    // On first load activeObjectType should be null, we want to make the first item in the list active
    if (activeObjectType === null && objectTypesWithConfig) {
      if (setObjectTypesWithConfig && setObjectTypesWithConfig?.length > 0) {
        setObjectType(setObjectTypesWithConfig[0].objectType);
        return;
      }

      if (
        customObjectTypesWithConfig &&
        customObjectTypesWithConfig?.length > 0
      ) {
        setObjectType(customObjectTypesWithConfig[0].objectType);
        return;
      }

      if (
        systemObjectTypesWithConfig &&
        systemObjectTypesWithConfig?.length > 0
      ) {
        setObjectType(systemObjectTypesWithConfig[0].objectType);
        return;
      }
    }
  }, [
    activeObjectType,
    customObjectTypesWithConfig,
    objectTypesWithConfig,
    setObjectType,
    setObjectTypesWithConfig,
    systemObjectTypesWithConfig,
  ]);

  return (
    <div className="flex flex-col text-left items-start">
      <ObjectTypeNavigationSection
        title="Sets"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={setObjectTypesWithConfig || []}
        setObjectType={setObjectType}
      />
      <ObjectTypeNavigationSection
        title="Custom Object Types"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={customObjectTypesWithConfig || []}
        setObjectType={setObjectType}
      />
      <ObjectTypeNavigationSection
        title="System Object Types"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={systemObjectTypesWithConfig || []}
        setObjectType={setObjectType}
      />
    </div>
  );
};
