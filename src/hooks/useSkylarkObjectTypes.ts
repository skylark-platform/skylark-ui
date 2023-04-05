import { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

import { SkylarkObjectType } from "src/interfaces/skylark";
import {
  getObjectOperations,
  getAllObjectsMeta,
} from "src/lib/skylark/objects";

import {
  useSkylarkSchema,
  useSkylarkSchemaInterfaceType,
} from "./useSkylarkSchemaIntrospection";

export const useSkylarkObjectTypes = (): Omit<UseQueryResult, "data"> & {
  objectTypes: string[] | undefined;
} => {
  // Newer Skylark's have a VisibleObject Interface which contains Availability
  const { data, ...rest } = useSkylarkSchemaInterfaceType("VisibleObject");
  const { data: legacyMetadataData } =
    useSkylarkSchemaInterfaceType("Metadata");

  const objectTypes = useMemo(() => {
    const objectTypes = data
      ? data?.possibleTypes.map(({ name }) => name) || []
      : undefined;
    const legacyMetadata = legacyMetadataData
      ? legacyMetadataData?.possibleTypes.map(({ name }) => name) || []
      : undefined;
    return (objectTypes || legacyMetadata)?.sort();
  }, [data, legacyMetadataData]);

  return {
    objectTypes,
    ...rest,
  };
};

// Returns the operations for a given object (createEpisode etc for Episode)
export const useSkylarkObjectOperations = (objectType: SkylarkObjectType) => {
  const { data, ...rest } = useSkylarkSchema();

  if (!data || !objectType) {
    return { objectOperations: null, ...rest };
  }

  const objectOperations = getObjectOperations(objectType, data.__schema);

  return {
    objectOperations,
    ...rest,
  };
};

export const useAllObjectsMeta = () => {
  const { data: schemaResponse, ...rest } = useSkylarkSchema();

  const { objectTypes } = useSkylarkObjectTypes();

  const { objects, allFieldNames } = useMemo(() => {
    const objects =
      schemaResponse && objectTypes
        ? getAllObjectsMeta(schemaResponse.__schema, objectTypes)
        : [];
    const allFieldNames = objects
      .flatMap(({ fields }) => fields)
      .map(({ name }) => name)
      .filter((name, index, self) => self.indexOf(name) === index);

    return {
      objects,
      allFieldNames,
    };
  }, [objectTypes, schemaResponse]);

  return {
    objects,
    allFieldNames,
    ...rest,
  };
};
