import { useQuery } from "@tanstack/react-query";
import {
  IntrospectionInterfaceType,
  IntrospectionQuery,
  IntrospectionType,
} from "graphql";

import { QueryKeys } from "src/enums/graphql";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { SKYLARK_SCHEMA_INTROSPECTION_QUERY } from "src/lib/graphql/skylark/queries";

export const useSkylarkSchemaIntrospection = () => {
  const { data, ...rest } = useQuery<IntrospectionQuery>({
    queryKey: [QueryKeys.Schema, SKYLARK_SCHEMA_INTROSPECTION_QUERY],
    queryFn: async () => skylarkRequest(SKYLARK_SCHEMA_INTROSPECTION_QUERY),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    data: data?.__schema,
    ...rest,
  };
};

export const useSkylarkSchemaIntrospectionTypesOfKind = <
  T extends IntrospectionType,
>(
  kind: IntrospectionType["kind"],
) => {
  const { data, ...rest } = useSkylarkSchemaIntrospection();
  const types = data?.types?.filter((type) => kind === type.kind) as
    | T[]
    | undefined;

  return {
    data: types,
    ...rest,
  };
};

export const useSkylarkSchemaInterfaceType = (typeName: string) => {
  const { data, ...rest } =
    useSkylarkSchemaIntrospectionTypesOfKind<IntrospectionInterfaceType>(
      "INTERFACE",
    );

  const type = data?.find(({ name }) => name === typeName);

  return {
    data: type,
    ...rest,
  };
};
