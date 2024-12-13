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
  useSkylarkSetObjectTypes,
} from "src/hooks/useSkylarkObjectTypes";
import {
  createIntrospectionQueryOptions,
  IntrospectionQueryOptions,
} from "src/hooks/useSkylarkSchemaIntrospection";
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

  const schemaVersionNumberFromQuery = parseSchemaVersionNumber(
    query?.slug?.[0],
  );
  const objectType = (query?.slug?.[1] as string) || null;

  const { activationStatus } = useActivationStatus();

  const schemaVersionNumber =
    schemaVersionNumberFromQuery || activationStatus?.activeVersion || null;

  const { setObjectTypes } = useSkylarkSetObjectTypes(
    true,
    createIntrospectionQueryOptions(
      schemaVersionNumberFromQuery
        ? { version: schemaVersionNumberFromQuery }
        : null,
      activationStatus?.activeVersion,
    ),
  );

  useEffect(() => {
    if (
      (!schemaVersionNumberFromQuery && activationStatus && setObjectTypes) ||
      (schemaVersionNumberFromQuery && !objectType && setObjectTypes)
    ) {
      const url = `/content-model/${schemaVersionNumber || activationStatus?.activeVersion}/${encodeURIComponent(setObjectTypes[0].toLowerCase())}`;
      push(url);
    }
  }, [
    activationStatus?.activeVersion,
    objectType,
    setObjectTypes,
    push,
    schemaVersionNumber,
    schemaVersionNumberFromQuery,
  ]);

  return (
    <div className="pt-nav">
      {objectType &&
      activationStatus &&
      activationStatus.activeVersion !== null ? (
        <ContentModel
          objectType={objectType}
          schemaVersionNumber={schemaVersionNumber}
          activeSchemaVersionNumber={activationStatus?.activeVersion}
        />
      ) : (
        <div className="flex justify-center w-full mt-20 items-center">
          <Spinner className="h-14 w-14 animate-spin" />
        </div>
      )}
    </div>
  );
}
