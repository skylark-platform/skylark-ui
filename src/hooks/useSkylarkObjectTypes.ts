import { useQuery } from "@tanstack/react-query";
import { DocumentNode, IntrospectionQuery } from "graphql";
import { useCallback, useMemo } from "react";

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
  selectSchema,
  useSkylarkSchemaInterfaceType,
  useSkylarkSchemaIntrospection,
} from "./useSkylarkSchemaIntrospection";

export const useSkylarkObjectTypes = (searchable: boolean) => {
  // VisibleObject Interface contains all items that appear in Search, whereas Metadata can all be added into Sets
  const { data } = useSkylarkSchemaInterfaceType(
    searchable ? "VisibleObject" : "Metadata",
  );

  const objectTypes = useMemo(() => {
    const objectTypes = data
      ? data?.possibleTypes.map(({ name }) => name) || []
      : undefined;
    return objectTypes?.sort();
  }, [data]);

  return {
    objectTypes,
  };
};

const useObjectTypesConfig = (objectTypes?: string[]) => {
  const query = createGetAllObjectsConfigQuery(objectTypes);

  const { data } = useQuery<GQLSkylarkObjectTypesWithConfig>({
    queryKey: [QueryKeys.ObjectTypesConfig, query],
    queryFn: async () => skylarkRequest(query as DocumentNode),
    enabled: query !== null,
  });

  const objectTypesWithConfig = objectTypes?.map((objectType) => ({
    objectType,
    config: data?.[objectType],
  }));

  return {
    objectTypesWithConfig,
  };
};

// Returns the operations for a given object (createEpisode etc for Episode)
export const useSkylarkObjectOperations = (objectType: SkylarkObjectType) => {
  const { data, isError } = useSkylarkSchemaIntrospection(selectSchema);

  if (!data || !objectType || isError) {
    return { objectOperations: null, isError };
  }

  try {
    const objectOperations = getObjectOperations(objectType, data);
    return {
      objectOperations,
      isError,
    };
  } catch (err) {
    return {
      objectOperations: null,
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
  const { data } = useSkylarkSchemaInterfaceType("Set");

  const setObjectTypes = data
    ? data?.possibleTypes.map(({ name }) => name) || []
    : undefined;

  return {
    setObjectTypes,
  };
};

export const useSkylarkSetObjectTypesWithConfig = () => {
  const { setObjectTypes } = useSkylarkSetObjectTypes();
  return useObjectTypesConfig(setObjectTypes);
};

export const useAllObjectsMeta = (searchableOnly?: boolean) => {
  const { objectTypes } = useSkylarkObjectTypes(!!searchableOnly);

  const { data } = useSkylarkSchemaIntrospection(
    useCallback(
      ({ __schema: schemaResponse }: IntrospectionQuery) => {
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
      },
      [objectTypes],
    ),
  );

  return {
    objects: data?.objects || null,
    allFieldNames: data?.allFieldNames,
  };
};

export const useAllSetObjectsMeta = () => {
  const { data: schemaResponse } = useSkylarkSchemaIntrospection(selectSchema);

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
  };
};
