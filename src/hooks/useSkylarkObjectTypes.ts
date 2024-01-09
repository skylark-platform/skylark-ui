import { useQuery } from "@tanstack/react-query";
import { DocumentNode, IntrospectionQuery } from "graphql";
import { useCallback, useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkObjectTypesWithConfig,
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAllObjectsConfigQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  getObjectOperations,
  getAllObjectsMeta,
} from "src/lib/skylark/objects";
import { parseObjectConfig } from "src/lib/skylark/parsers";
import { ObjectError } from "src/lib/utils/errors";

import {
  selectSchema,
  useSkylarkSchemaInterfaceType,
  useSkylarkSchemaIntrospection,
} from "./useSkylarkSchemaIntrospection";

export interface ObjectTypeWithConfig {
  objectType: string;
  config: ParsedSkylarkObjectConfig;
}

export const sortObjectTypesWithConfig = (
  a: {
    objectType: string;
    config?: ParsedSkylarkObjectConfig;
  },
  b: {
    objectType: string;
    config?: ParsedSkylarkObjectConfig;
  },
) => {
  const objTypeA = (
    a.config?.objectTypeDisplayName || a.objectType
  ).toUpperCase();
  const objTypeB = (
    b.config?.objectTypeDisplayName || b.objectType
  ).toUpperCase();
  return objTypeA < objTypeB ? -1 : objTypeA > objTypeB ? 1 : 0;
};

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

  const { data, isLoading } = useQuery<GQLSkylarkObjectTypesWithConfig>({
    queryKey: [QueryKeys.ObjectTypesConfig, query],
    queryFn: async () => skylarkRequest("query", query as DocumentNode),
    enabled: objectTypes && query !== null,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity,
  });

  const objectTypesWithConfig: ObjectTypeWithConfig[] | undefined = useMemo(
    () =>
      objectTypes
        ?.map((objectType) => ({
          objectType,
          config: parseObjectConfig(objectType, data?.[objectType]),
        }))
        .sort(sortObjectTypesWithConfig),
    [data, objectTypes],
  );

  return {
    objectTypesWithConfig,
    numObjectTypes: objectTypes?.length,
    isLoading,
  };
};

// Returns the operations for a given object (createEpisode etc for Episode)
export const useSkylarkObjectOperations = (objectType: SkylarkObjectType) => {
  const { data, isError } = useSkylarkSchemaIntrospection(selectSchema);

  const res: {
    objectOperations: SkylarkObjectMeta | null;
    isError: boolean;
    error?: ObjectError | unknown;
  } = useMemo(() => {
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
  }, [data, isError, objectType]);

  return res;
};

export const useSkylarkObjectTypesWithConfig = () => {
  const { objectTypes } = useSkylarkObjectTypes(true);
  const ret = useObjectTypesConfig(objectTypes);
  return {
    ...ret,
    isLoading: !objectTypes || ret.isLoading,
  };
};

export const useSkylarkSetObjectTypes = (searchable: boolean) => {
  const { objectTypes } = useSkylarkObjectTypes(searchable);
  const { data } = useSkylarkSchemaInterfaceType("Set");

  const setObjectTypes = useMemo(() => {
    const setObjectTypes =
      data && objectTypes
        ? data?.possibleTypes
            .map(({ name }) => name)
            .filter((setType) => objectTypes.includes(setType)) || []
        : undefined;

    return setObjectTypes;
  }, [data, objectTypes]);

  return {
    setObjectTypes,
  };
};

export const useSkylarkSetObjectTypesWithConfig = () => {
  const { setObjectTypes } = useSkylarkSetObjectTypes(true);
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

  const { setObjectTypes } = useSkylarkSetObjectTypes(false);

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
