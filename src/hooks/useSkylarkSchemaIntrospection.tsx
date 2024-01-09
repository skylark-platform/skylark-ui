import { useQuery } from "@tanstack/react-query";
import {
  IntrospectionInterfaceType,
  IntrospectionQuery,
  IntrospectionType,
} from "graphql";
import { useCallback } from "react";

import { QueryKeys } from "src/enums/graphql";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { SKYLARK_SCHEMA_INTROSPECTION_QUERY } from "src/lib/graphql/skylark/queries";

import { useSkylarkCreds } from "./localStorage/useCreds";

export const selectSchema = (data: IntrospectionQuery) => data.__schema;

export const useSkylarkSchemaIntrospection = <
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  TData extends unknown = IntrospectionQuery,
>(
  select?: (data: IntrospectionQuery) => TData,
) => {
  const [creds] = useSkylarkCreds();

  const { data, isError } = useQuery<IntrospectionQuery, Error, TData>({
    // refetch when creds.uri changes
    queryKey: [
      QueryKeys.Schema,
      SKYLARK_SCHEMA_INTROSPECTION_QUERY,
      creds?.uri,
    ],
    queryFn: async () =>
      skylarkRequest(
        "query",
        SKYLARK_SCHEMA_INTROSPECTION_QUERY,
        {},
        { useCache: true },
      ),
    select,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity,
  });
  return {
    data: data,
    isError,
  };
};

export const useSkylarkSchemaIntrospectionTypesOfKind = <
  T extends IntrospectionType,
>(
  kind: IntrospectionType["kind"],
) => {
  const { data } = useSkylarkSchemaIntrospection(
    useCallback(
      (d: IntrospectionQuery) =>
        d.__schema.types.filter((type) => kind === type.kind) as
          | T[]
          | undefined,
      [kind],
    ),
  );
  return {
    data,
  };
};

export const useSkylarkSchemaInterfaceType = (typeName: string) => {
  const { data } = useSkylarkSchemaIntrospection(
    useCallback(
      (d: IntrospectionQuery) =>
        d.__schema.types.find(
          (type) => type.kind === "INTERFACE" && type.name === typeName,
        ) as IntrospectionInterfaceType | undefined,
      [typeName],
    ),
  );
  return {
    data,
  };
};
