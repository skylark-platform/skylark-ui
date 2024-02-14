import { useRouter } from "next/router";
import { useState } from "react";

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
import { ObjectTypeNavigation } from "./navigation/contentModelNavigation.component";

export const ContentModel = () => {
  const { query } = useRouter();

  const { schemaVersions } = useSchemaVersions();

  const { activationStatus } = useActivationStatus();
  const [activeSchemaVersionState, setActiveSchemaVersion] = useState<
    number | null
  >(null);
  const activeSchemaVersion =
    activeSchemaVersionState === null
      ? activationStatus?.activeVersion
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
    <>
      {allObjectsMeta && objectTypesWithConfig ? (
        <div className="mt-10 max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-4">
            <h1>Content Model Editor</h1>
            <div>
              <Select
                label="Version"
                variant="primary"
                placeholder="Schema Version"
                className="w-52"
                options={
                  schemaVersions
                    ?.sort(({ version: va }, { version: vb }) => vb - va)
                    .map(({ active, version }) => ({
                      label: `${version}${active ? " (active)" : ""}`,
                      value: version,
                    })) || []
                }
                selected={activeSchemaVersion || undefined}
                onChange={(v) => setActiveSchemaVersion(v)}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 px-4">
            <ObjectTypeNavigation
              activeObjectType={activeObjectType}
              schemaOpts={schemaOpts}
            />
            <div className="col-span-3">
              {objectMeta &&
                !isLoadingObjectTypesWithConfig &&
                objectTypesWithConfig &&
                (!isLoadingRelationshipConfig ||
                  objectMeta.name ===
                    BuiltInSkylarkObjectType.Availability) && (
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
        </div>
      ) : (
        <div className="flex mt-32 justify-center w-full h-full items-center">
          <Spinner className="h-14 w-14 animate-spin" />
        </div>
      )}
    </>
  );
};
