import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

import {
  useSkylarkSetObjectTypes,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObjectConfig } from "src/interfaces/skylark";
import { isSkylarkObjectType } from "src/lib/utils";

interface ObjectTypeNavigationProps {
  activeObjectType: string | null;
}

const ObjectTypeNavigationSection = ({
  title,
  activeObjectType,
  objectTypesWithConfig,
}: {
  title: string;
  activeObjectType: string | null;
  objectTypesWithConfig: {
    objectType: string;
    config: ParsedSkylarkObjectConfig;
  }[];
}) => (
  <div className="flex flex-col justify-start items-start my-4 w-full">
    <p className="mb-1 font-medium text-lg">{title}</p>
    {objectTypesWithConfig?.map(({ objectType, config }) => {
      return (
        <Link
          key={objectType}
          className={clsx(
            "my-1 flex items-center w-full",
            activeObjectType?.toLowerCase() === objectType.toLowerCase()
              ? "text-black font-medium"
              : "text-manatee-600",
          )}
          href={`/content-model/${encodeURIComponent(objectType)}`}
        >
          <span
            className="w-4 h-4 block rounded mr-1 whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ backgroundColor: config.colour || undefined }}
          />
          {config.objectTypeDisplayName &&
          config.objectTypeDisplayName !== objectType ? (
            <>
              {objectType}{" "}
              <span className="text-manatee-400 block text-ellipsis font-normal ml-1 whitespace-nowrap overflow-hidden">
                ({config.objectTypeDisplayName})
              </span>
            </>
          ) : (
            objectType
          )}
        </Link>
      );
    })}
  </div>
);

export const ObjectTypeNavigation = ({
  activeObjectType,
}: ObjectTypeNavigationProps) => {
  const { push } = useRouter();

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
      const initialObjectType = (
        setObjectTypesWithConfig?.[0] ||
        customObjectTypesWithConfig?.[0] ||
        systemObjectTypesWithConfig?.[0]
      )?.objectType;

      // Redirect to initialObjectType
      push(`/content-model/${initialObjectType}`);
    }
  }, [
    activeObjectType,
    customObjectTypesWithConfig,
    objectTypesWithConfig,
    push,
    setObjectTypesWithConfig,
    systemObjectTypesWithConfig,
  ]);

  return (
    <div
      className="flex flex-col text-left items-start grid-cols-1"
      data-testid="content-editor-navigation"
    >
      <ObjectTypeNavigationSection
        title="Sets"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={setObjectTypesWithConfig || []}
      />
      <ObjectTypeNavigationSection
        title="Custom Object Types"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={customObjectTypesWithConfig || []}
      />
      <ObjectTypeNavigationSection
        title="System Object Types"
        activeObjectType={activeObjectType}
        objectTypesWithConfig={systemObjectTypesWithConfig || []}
      />
    </div>
  );
};
