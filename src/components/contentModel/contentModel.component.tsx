import { useRouter } from "next/router";
import { useState } from "react";

import { Spinner } from "src/components/icons";
import { useActivationStatus } from "src/hooks/useAccountStatus";
import { useObjectTypeRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import { isAvailabilityOrAudienceSegment } from "src/lib/utils";

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
  const { objectTypesConfig, isLoading: isLoadingObjectTypesWithConfig } =
    useSkylarkObjectTypesWithConfig({ introspectionOpts: schemaOpts });

  const activeObjectType = (query?.objectType?.[0] as string) || null;

  const objectMeta = allObjectsMeta?.find(
    ({ name }) => name.toLowerCase() === activeObjectType?.toLowerCase(),
  );

  const config = objectTypesConfig?.[objectMeta?.name || ""];

  const {
    objectTypeRelationshipConfig: relationshipConfig,
    isLoading: isLoadingRelationshipConfig,
  } = useObjectTypeRelationshipConfiguration(objectMeta?.name || null);

  const isLoading =
    !allObjectsMeta ||
    isLoadingObjectTypesWithConfig ||
    (isLoadingRelationshipConfig &&
      !isAvailabilityOrAudienceSegment(objectMeta?.name));

  return (
    <div className="max-w-8xl mx-auto px-4 md:px-8">
      <ContentModelHeader
        activeSchemaVersion={activationStatus?.activeVersion || 0}
        schemaVersion={activeSchemaVersion}
        setSchemaVersion={setActiveSchemaVersion}
      />

      {allObjectsMeta && objectTypesConfig ? (
        <div className="grid grid-cols-4 gap-4">
          <ObjectTypeNavigation
            activeObjectType={activeObjectType}
            schemaOpts={schemaOpts}
          />

          <div className="col-span-3 h-full">
            {objectMeta && !isLoading && (
              <ObjectTypeEditor
                key={`${activeObjectType}-${config}`}
                objectMeta={objectMeta}
                objectConfig={config}
                relationshipConfig={relationshipConfig || {}}
                allObjectsMeta={allObjectsMeta}
              />
            )}
            {isLoading && (
              <div className="flex justify-center w-full mt-20 items-center">
                <Spinner className="h-14 w-14 animate-spin" />
              </div>
            )}
            {!isLoading && activeObjectType && !objectMeta && (
              <p className="mt-10">
                Requested Object Type &quot;
                <span className="font-medium">{activeObjectType}</span>
                &quot; does not exist in this schema version.
              </p>
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
