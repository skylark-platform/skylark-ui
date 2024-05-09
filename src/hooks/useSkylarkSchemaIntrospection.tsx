import { useQuery } from "@tanstack/react-query";
import {
  IntrospectionEnumType,
  IntrospectionInterfaceType,
  IntrospectionQuery,
  IntrospectionType,
} from "graphql";
import { useCallback } from "react";

import { QueryKeys } from "src/enums/graphql";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  GET_CONFIGURATION_SCHEMA,
  SKYLARK_SCHEMA_INTROSPECTION_QUERY,
} from "src/lib/graphql/skylark/queries";

import { useSkylarkCreds } from "./localStorage/useCreds";

export interface IntrospectionQueryOptions {
  schemaVersion?: number;
}

export const selectSchema = (data: IntrospectionQuery) => data.__schema;

export const useSkylarkSchemaIntrospectionViaGraphQL = <
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  TData extends unknown = IntrospectionQuery,
>(
  select?: (data: IntrospectionQuery) => TData,
  disabled?: boolean,
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
    enabled: !disabled,
  });
  return {
    data: data,
    isError,
  };
};

export const useSkylarkSchemaIntrospectionViaSkylarkPassthrough = <
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  TData extends unknown = IntrospectionQuery,
>(
  version?: number,
  select?: (data: IntrospectionQuery) => TData,
  disabled?: boolean,
) => {
  const [creds] = useSkylarkCreds();

  const { data, isError } = useQuery<
    { getConfigurationSchema: string },
    Error,
    TData
  >({
    // refetch when creds.uri changes
    queryKey: [QueryKeys.Schema, GET_CONFIGURATION_SCHEMA, creds?.uri, version],
    queryFn: async () =>
      skylarkRequest(
        "query",
        GET_CONFIGURATION_SCHEMA,
        {
          version,
          query: SKYLARK_SCHEMA_INTROSPECTION_QUERY,
        },
        { useCache: true },
      ),
    select: useCallback(
      (data: { getConfigurationSchema: string }) => {
        const parsedData = JSON.parse(
          data.getConfigurationSchema,
        ) as IntrospectionQuery;
        return select ? select(parsedData) : (parsedData as TData);
      },
      [select],
    ),
    enabled: !disabled,
  });

  return {
    data: data,
    isError,
  };
};

export const useSkylarkSchemaIntrospection = <
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  TData extends unknown = IntrospectionQuery,
>(
  select?: (data: IntrospectionQuery) => TData,
  opts?: IntrospectionQueryOptions,
) => {
  const useSkylarkPassthrough = Boolean(
    opts?.schemaVersion && opts.schemaVersion > -1,
  );

  const gqlIntrospection = useSkylarkSchemaIntrospectionViaGraphQL(
    select,
    useSkylarkPassthrough,
  );

  const slPassthrough = useSkylarkSchemaIntrospectionViaSkylarkPassthrough(
    opts?.schemaVersion,
    select,
    !useSkylarkPassthrough,
  );

  return !useSkylarkPassthrough ? gqlIntrospection : slPassthrough;
};

export const useSkylarkSchemaIntrospectionTypesOfKind = <
  T extends IntrospectionType,
>(
  kind: IntrospectionType["kind"],
  introspectionOpts?: IntrospectionQueryOptions,
) => {
  const { data } = useSkylarkSchemaIntrospection(
    useCallback(
      (d: IntrospectionQuery) =>
        d.__schema.types.filter((type) => kind === type.kind) as
          | T[]
          | undefined,
      [kind],
    ),
    introspectionOpts,
  );
  return {
    data,
  };
};

export const useSkylarkSchemaInterfaceType = (
  typeName: string,
  introspectionOpts?: IntrospectionQueryOptions,
) => {
  const { data } = useSkylarkSchemaIntrospection(
    useCallback(
      (d: IntrospectionQuery) =>
        d.__schema.types.find(
          (type) => type.kind === "INTERFACE" && type.name === typeName,
        ) as IntrospectionInterfaceType | undefined,
      [typeName],
    ),
    introspectionOpts,
  );
  return {
    data,
  };
};

export const useSkylarkSchemaEnum = (
  enumName: string,
  introspectionOpts?: IntrospectionQueryOptions,
) => {
  const { data } = useSkylarkSchemaIntrospection(
    useCallback(
      (d: IntrospectionQuery) => {
        const e = d.__schema.types.find(
          (type) => type.kind === "ENUM" && type.name === enumName,
        ) as IntrospectionEnumType | undefined;

        return {
          enum: e,
          values: e?.enumValues.map((enumValue) => enumValue.name),
        };
      },
      [enumName],
    ),
    introspectionOpts,
  );
  return {
    data,
  };
};
