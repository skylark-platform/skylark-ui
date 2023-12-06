import { useRouter } from "next/router";
import { useState } from "react";

import { Spinner } from "src/components/icons";
import { useObjectTypeRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectType,
} from "src/interfaces/skylark";

import { ObjectTypeEditor } from "./editor/contentModelEditor.component";
import { ObjectTypeNavigation } from "./navigation/contentModelNavigation.component";

export const ContentModel = () => {
  const { query } = useRouter();

  const { objects: allObjectsMeta } = useAllObjectsMeta(true);
  const { objectTypesWithConfig, isLoading: isLoadingObjectTypesWithConfig } =
    useSkylarkObjectTypesWithConfig();

  const activeObjectType = (query?.objectType?.[0] as string) || null;

  const objectMeta = allObjectsMeta?.find(
    ({ name }) => name.toLowerCase() === activeObjectType?.toLowerCase(),
  );

  const config = objectTypesWithConfig?.find(
    ({ objectType }) => objectType === objectMeta?.name,
  )?.config;

  const {
    objectTypeRelationshipConfig: relationshipConfig,
    isLoading: isLoadingRelationshipConfig,
  } = useObjectTypeRelationshipConfiguration(objectMeta?.name || null);

  return (
    <>
      {allObjectsMeta && objectTypesWithConfig ? (
        <div className="mt-10 max-w-7xl mx-auto grid grid-cols-4 gap-4 px-4">
          <ObjectTypeNavigation activeObjectType={activeObjectType} />
          <div className="col-span-3">
            {objectMeta &&
              !isLoadingObjectTypesWithConfig &&
              objectTypesWithConfig &&
              (!isLoadingRelationshipConfig ||
                objectMeta.name === BuiltInSkylarkObjectType.Availability) && (
                <ObjectTypeEditor
                  key={`${activeObjectType}-${config}`}
                  objectMeta={objectMeta}
                  objectConfig={config}
                  relationshipConfig={relationshipConfig || {}}
                  allObjectsMeta={allObjectsMeta}
                />
              )}
          </div>
        </div>
      ) : (
        <div className="flex mt-32 justify-center w-full h-full items-center">
          <Spinner className="h-14 w-14 animate-spin" />
        </div>
      )}
    </>
  );
};
