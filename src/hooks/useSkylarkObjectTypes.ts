import { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

import { SkylarkObjectType } from "src/interfaces/skylark";
import {
  getObjectOperations,
  getAllObjectsMeta,
} from "src/lib/skylark/objects";
import { ObjectError } from "src/lib/utils/errors";

import {
  useSkylarkSchemaInterfaceType,
  useSkylarkSchemaIntrospection,
} from "./useSkylarkSchemaIntrospection";

export const useSkylarkObjectTypes = (
  searchable: boolean,
): Omit<UseQueryResult, "data"> & {
  objectTypes: string[] | undefined;
} => {
  // Newer Skylark's have a VisibleObject Interface which contains all items that appear in Search, whereas Metadata can all be added into Sets
  const { data, ...rest } = useSkylarkSchemaInterfaceType(
    searchable ? "VisibleObject" : "Metadata",
  );

  // TODO remove when beta is switched off
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
  const { data, ...rest } = useSkylarkSchemaIntrospection();

  if (!data || !objectType || rest.isError) {
    return { objectOperations: null, ...rest };
  }

  try {
    const objectOperations = getObjectOperations(objectType, data);
    return {
      objectOperations,
      ...rest,
    };
  } catch (err) {
    return {
      objectOperations: null,
      ...rest,
      isError: true,
      error: err as ObjectError | unknown,
    };
  }
};

export const useAllObjectsMeta = (searchable: boolean) => {
  const { data: schemaResponse, ...rest } = useSkylarkSchemaIntrospection();

  const { objectTypes } = useSkylarkObjectTypes(searchable);

  const { objects, allFieldNames } = useMemo(() => {
    const objects =
      schemaResponse && objectTypes
        ? getAllObjectsMeta(schemaResponse, objectTypes)
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
