import { useRouter } from "next/router";
import { useState } from "react";

import { Button } from "src/components/button";
import { Spinner } from "src/components/icons";
import { Select } from "src/components/inputs/select";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";
import { useActivationStatus } from "src/hooks/useAccountStatus";
import { useObjectTypeRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";

import { ObjectTypeEditor } from "./editor/contentModelEditor.component";
import { ContentModelHeader } from "./header/contentModelHeader.component";
import { ObjectTypeNavigation } from "./navigation/contentModelNavigation.component";

export const ContentModel = () => {
  const { query } = useRouter();

  const { activationStatus } = useActivationStatus();
  const [activeSchemaVersionState, setActiveSchemaVersion] = useState<
    number | null
  >(null);
  const activeSchemaVersion =
    activeSchemaVersionState === null
      ? activationStatus?.activeVersion || null
      : activeSchemaVersionState;

  const schemaOpts: IntrospectionQueryOptions | undefined =
    activeSchemaVersion !== null &&
    activeSchemaVersion !== undefined &&
    activeSchemaVersion !== activationStatus?.activeVersion
      ? {
          schemaVersion: activeSchemaVersion,
        }
      : undefined;

  const { objects: allObjectsMeta } = useAllObjectsMeta(true, schemaOpts);
  const { objectTypesWithConfig, isLoading: isLoadingObjectTypesWithConfig } =
    useSkylarkObjectTypesWithConfig(schemaOpts);

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
    <div className="mt-4 max-w-7xl mx-auto">
      <ContentModelHeader
        activeSchemaVersion={activationStatus?.activeVersion || 0}
        schemaVersion={activeSchemaVersion}
        setSchemaVersion={setActiveSchemaVersion}
      />

      {allObjectsMeta && objectTypesWithConfig ? (
        <div className="grid grid-cols-4 gap-4">
          <div className="">
            <ObjectTypeNavigation
              activeObjectType={activeObjectType}
              schemaOpts={schemaOpts}
            />
          </div>

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
    </div>
  );
};
