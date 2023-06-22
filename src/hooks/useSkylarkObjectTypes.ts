import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkObjectTypesWithConfig,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAllObjectsConfigQuery } from "src/lib/graphql/skylark/dynamicQueries";
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

const useObjectTypesConfig = (objectTypes?: string[]) => {
  const query = createGetAllObjectsConfigQuery(objectTypes);

  const { data, ...rest } = useQuery<GQLSkylarkObjectTypesWithConfig>({
    queryKey: [QueryKeys.ObjectTypesConfig, query],
    queryFn: async () => skylarkRequest(query as DocumentNode),
    enabled: query !== null,
  });

  const objectTypesWithConfig = objectTypes?.map((objectType) => ({
    objectType,
    config: data?.[objectType],
  }));

  return {
    ...rest,
    objectTypesWithConfig,
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

export const useSkylarkObjectTypesWithConfig = () => {
  const { objectTypes } = useSkylarkObjectTypes(true);
  return useObjectTypesConfig(objectTypes);
};

export const useSkylarkSetObjectTypes = () => {
  const { data, ...rest } = useSkylarkSchemaInterfaceType("Set");

  const setObjectTypes = data
    ? data?.possibleTypes.map(({ name }) => name) || []
    : undefined;

  return {
    setObjectTypes,
    ...rest,
  };
};

export const useSkylarkSetObjectTypesWithConfig = () => {
  const { setObjectTypes } = useSkylarkSetObjectTypes();
  return useObjectTypesConfig(setObjectTypes);
};

export const useAllObjectsMeta = (searchableOnly?: boolean) => {
  const { data: schemaResponse, ...rest } = useSkylarkSchemaIntrospection();

  const { objectTypes } = useSkylarkObjectTypes(!!searchableOnly);

  const { objects, allFieldNames } = useMemo(() => {
    const objects =
      schemaResponse && objectTypes
        ? getAllObjectsMeta(schemaResponse, objectTypes)
        : null;

    const allFieldNames = objects
      ?.flatMap(({ fields }) => fields)
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

export const useAllSetObjectsMeta = () => {
  const { data: schemaResponse, ...rest } = useSkylarkSchemaIntrospection();

  const { setObjectTypes } = useSkylarkSetObjectTypes();

  const { setObjects, allFieldNames } = useMemo(() => {
    const setObjects =
      schemaResponse && setObjectTypes
        ? getAllObjectsMeta(schemaResponse, setObjectTypes)
        : [];
    const allFieldNames = setObjects
      .flatMap(({ fields }) => fields)
      .map(({ name }) => name)
      .filter((name, index, self) => self.indexOf(name) === index);

    return {
      setObjects,
      allFieldNames,
    };
  }, [setObjectTypes, schemaResponse]);

  return {
    setObjects,
    allFieldNames,
    ...rest,
  };
};
