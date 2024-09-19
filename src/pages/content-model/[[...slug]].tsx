import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { ContentModel } from "src/components/contentModel";
import { Spinner } from "src/components/icons";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";
import { useActivationStatus } from "src/hooks/useAccountStatus";
import { useAllObjectTypesRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  useAllObjectsMeta,
  useSkylarkObjectTypes,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import { SchemaVersion } from "src/interfaces/skylark/environment";

const parseSchemaVersionNumber = (
  queryValue: string | undefined,
): number | null => {
  if (!queryValue || typeof queryValue !== "string") {
    return null;
  }

  try {
    return parseInt(queryValue);
  } catch {
    return null;
  }
};

export default function ContentModelPage() {
  const { query, push } = useRouter();

  const schemaVersionNumber = parseSchemaVersionNumber(query?.slug?.[0]);
  const objectType = (query?.slug?.[1] as string) || null;

  const { activationStatus } = useActivationStatus();
  const { schemaVersions } = useSchemaVersions();

  const schemaVersion: SchemaVersion | null =
    schemaVersionNumber === null
      ? activationStatus?.activeVersion
        ? {
            version: activationStatus.activeVersion,
            baseVersion: -1,
            isDraft: false,
            isPublished: true,
            isActive: true,
          }
        : null
      : schemaVersions?.find(
          ({ version }) => version === schemaVersionNumber,
        ) || null;

  const { objectTypes } = useSkylarkObjectTypes(
    true,
    schemaVersion ? { schemaVersion: schemaVersion.version } : undefined,
  );

  useEffect(() => {
    if (
      (!schemaVersionNumber &&
        activationStatus?.activeVersion &&
        objectTypes) ||
      (schemaVersionNumber && !objectType && objectTypes)
    ) {
      const url = `/content-model/${schemaVersionNumber || activationStatus?.activeVersion}/${encodeURIComponent(objectTypes[0].toLowerCase())}`;
      push(url);
    }
  }, [
    activationStatus?.activeVersion,
    objectType,
    objectTypes,
    push,
    schemaVersionNumber,
  ]);

  const schemaOpts: IntrospectionQueryOptions | undefined =
    schemaVersion !== null &&
    schemaVersion !== undefined &&
    schemaVersion?.version !== activationStatus?.activeVersion
      ? {
          schemaVersion: schemaVersion.version,
        }
      : undefined;

  const { objects: allObjectsMeta } = useAllObjectsMeta(true, schemaOpts);
  const { objectTypesWithConfig, isLoading: isLoadingObjectTypesWithConfig } =
    useSkylarkObjectTypesWithConfig(schemaOpts);

  const {
    allObjectTypesRelationshipConfig,
    isLoading: isLoadingRelationshipConfig,
  } = useAllObjectTypesRelationshipConfiguration();

  return (
    <div className="pt-nav">
      {schemaVersion &&
      activationStatus?.activeVersion &&
      objectType &&
      allObjectsMeta &&
      objectTypesWithConfig &&
      allObjectTypesRelationshipConfig &&
      !isLoadingObjectTypesWithConfig &&
      !isLoadingRelationshipConfig ? (
        <ContentModel
          key={schemaVersion.version}
          schemaVersion={schemaVersion}
          objectType={objectType}
          activeVersionNumber={activationStatus.activeVersion}
          allObjectsMeta={allObjectsMeta}
          objectTypesWithConfig={objectTypesWithConfig}
          allObjectTypesRelationshipConfig={allObjectTypesRelationshipConfig}
        />
      ) : (
        <div className="flex justify-center w-full mt-20 items-center">
          <Spinner className="h-14 w-14 animate-spin" />
        </div>
      )}
    </div>
  );
}
