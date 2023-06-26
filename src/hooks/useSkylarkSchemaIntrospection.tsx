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

const useSkylarkSchema = <
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  TData extends unknown = IntrospectionQuery,
>(
  select?: (data: IntrospectionQuery) => TData,
) => {
  const { data, isError } = useQuery<IntrospectionQuery, Error, TData>({
    queryKey: [QueryKeys.Schema, SKYLARK_SCHEMA_INTROSPECTION_QUERY],
    queryFn: async () =>
      skylarkRequest(
        SKYLARK_SCHEMA_INTROSPECTION_QUERY,
        {},
        { useCache: true },
      ),
    select,
  });
  return {
    data: data,
    isError,
  };
};

export const useSkylarkSchemaIntrospection = () => {
  const { data, isError } = useSkylarkSchema((d) => d.__schema);
  return {
    data,
    isError,
  };
};

export const useSkylarkSchemaIntrospectionTypesOfKind = <
  T extends IntrospectionType,
>(
  kind: IntrospectionType["kind"],
) => {
  const { data } = useSkylarkSchema(
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
  const { data } = useSkylarkSchema(
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
