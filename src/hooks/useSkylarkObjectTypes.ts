import { useQuery } from "@tanstack/react-query";
import { DocumentNode, IntrospectionQuery } from "graphql";
import { useCallback, useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  BuiltInSkylarkObjectType,
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
import { isAvailabilityOrAudienceSegment } from "src/lib/utils";
import { ObjectError } from "src/lib/utils/errors";

import {
  IntrospectionQueryOptions,
  selectSchema,
  useSkylarkSchemaInterfaceType,
  useSkylarkSchemaIntrospection,
} from "./useSkylarkSchemaIntrospection";

export interface ObjectTypeWithConfig {
  objectType: string;
  config: ParsedSkylarkObjectConfig;
}

export type ObjectTypesConfigObject = Record<
  SkylarkObjectType,
  ParsedSkylarkObjectConfig
>;

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

export const useSkylarkObjectTypes = (
  opts: {
    searchable?: boolean;
    withAvailabilityObjectTypes?: boolean;
    introspectionOpts?: IntrospectionQueryOptions | undefined;
  } = {
    searchable: false,
    withAvailabilityObjectTypes: true,
    introspectionOpts: undefined,
  },
) => {
  // VisibleObject Interface contains all items that appear in Search, whereas Metadata can all be added into Sets
  const { data } = useSkylarkSchemaInterfaceType(
    opts.searchable ? "VisibleObject" : "Metadata",
    opts.introspectionOpts,
  );

  const objectTypes = useMemo(() => {
    const objectTypes = data
      ? data?.possibleTypes.map(({ name }) => name) || []
      : undefined;

    const sorted = objectTypes?.sort();

    return opts.withAvailabilityObjectTypes ||
      typeof opts.withAvailabilityObjectTypes === "undefined"
      ? sorted
      : sorted?.filter((ot) => !isAvailabilityOrAudienceSegment(ot));
  }, [data, opts.withAvailabilityObjectTypes]);

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

  const { objectTypesWithConfig, objectTypesConfig } = useMemo((): {
    objectTypesWithConfig?: ObjectTypeWithConfig[];
    objectTypesConfig?: ObjectTypesConfigObject;
  } => {
    const objectTypesWithConfig = objectTypes
      ?.map((objectType) => ({
        objectType,
        config: parseObjectConfig(objectType, data?.[objectType]),
      }))
      .sort(sortObjectTypesWithConfig);

    const objectTypesConfig = objectTypesWithConfig
      ? Object.fromEntries(
          objectTypesWithConfig.map(({ objectType, config }) => [
            objectType,
            config,
          ]),
        )
      : undefined;

    return {
      objectTypesWithConfig,
      objectTypesConfig,
    };
  }, [data, objectTypes]);

  return {
    objectTypesWithConfig,
    objectTypesConfig,
    numObjectTypes: objectTypes?.length,
    isLoading,
  };
};

// Returns the operations for a given object (createEpisode etc for Episode)
export const useSkylarkObjectOperations = (
  objectType: SkylarkObjectType,
  introspectionOpts?: IntrospectionQueryOptions,
) => {
  const { data, isError } = useSkylarkSchemaIntrospection(
    selectSchema,
    introspectionOpts,
  );

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

export const useSkylarkObjectTypesWithConfig = (opts?: {
  withAvailabilityObjectTypes?: boolean;
  introspectionOpts?: IntrospectionQueryOptions | undefined;
}) => {
  const { objectTypes } = useSkylarkObjectTypes({ ...opts, searchable: true });
  const ret = useObjectTypesConfig(objectTypes);
  return {
    ...ret,
    isLoading: !objectTypes || ret.isLoading,
  };
};

export const useSkylarkSetObjectTypes = (
  searchable: boolean,
  introspectionOpts?: IntrospectionQueryOptions | undefined,
) => {
  const { objectTypes } = useSkylarkObjectTypes({
    introspectionOpts,
    searchable,
  });
  const { data } = useSkylarkSchemaInterfaceType("Set", introspectionOpts);

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

export const useSkylarkSetObjectTypesWithConfig = (
  introspectionOpts?: IntrospectionQueryOptions | undefined,
) => {
  const { setObjectTypes } = useSkylarkSetObjectTypes(true, introspectionOpts);
  return useObjectTypesConfig(setObjectTypes);
};

export const useAllObjectsMeta = (
  searchableOnly?: boolean,
  introspectionOpts?: IntrospectionQueryOptions,
) => {
  const { objectTypes } = useSkylarkObjectTypes({
    introspectionOpts,
    searchable: !!searchableOnly,
  });

  const { data } = useSkylarkSchemaIntrospection(
    useCallback(
      ({ __schema: schemaResponse }: IntrospectionQuery) => {
        const objects =
          schemaResponse && objectTypes
            ? getAllObjectsMeta(schemaResponse, objectTypes)
            : null;

        const allFieldNames = objects
          ?.flatMap(({ fields }) => fields.allNames)
          .filter((name, index, self) => self.indexOf(name) === index);

        return {
          objects,
          allFieldNames,
        };
      },
      [objectTypes],
    ),
    introspectionOpts,
  );

  return {
    objects: data?.objects || null,
    allFieldNames: data?.allFieldNames,
  };
};

export const useAllSetObjectsMeta = (
  introspectionOpts?: IntrospectionQueryOptions,
) => {
  const { data: schemaResponse } = useSkylarkSchemaIntrospection(
    selectSchema,
    introspectionOpts,
  );

  const { setObjectTypes } = useSkylarkSetObjectTypes(false);

  const { setObjects, allFieldNames } = useMemo(() => {
    const setObjects =
      schemaResponse && setObjectTypes
        ? getAllObjectsMeta(schemaResponse, setObjectTypes)
        : [];
    const allFieldNames = setObjects
      .flatMap(({ fields }) => fields.allNames)
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
