import { useState } from "react";

import { Spinner } from "src/components/icons";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectType } from "src/interfaces/skylark";

import { ObjectTypeEditor } from "./editor/contentModelEditor.component";
import { ObjectTypeNavigation } from "./navigation/contentModelNavigation.component";

export const ContentModel = () => {
  const { objects: allObjectsMeta } = useAllObjectsMeta(true); // TODO do we want to show the Favourite List?
  const { objectTypesWithConfig, isLoading: isLoadingObjectTypesWithConfig } =
    useSkylarkObjectTypesWithConfig();

  const [activeObjectType, setObjectType] = useState<SkylarkObjectType | null>(
    null,
  );

  const objectMeta = allObjectsMeta?.find(
    ({ name }) => name === activeObjectType,
  );

  const config = objectTypesWithConfig?.find(
    ({ objectType }) => objectType === objectMeta?.name,
  )?.config;

  return (
    <>
      {allObjectsMeta && objectTypesWithConfig ? (
        <div className="mt-10 max-w-7xl mx-auto grid grid-cols-4 px-4">
          <ObjectTypeNavigation
            setObjectType={setObjectType}
            activeObjectType={activeObjectType}
          />
          <div className="col-span-3">
            {objectMeta &&
              !isLoadingObjectTypesWithConfig &&
              objectTypesWithConfig && (
                <ObjectTypeEditor
                  key={`${activeObjectType}-${config}`}
                  objectMeta={objectMeta}
                  objectConfig={config}
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
