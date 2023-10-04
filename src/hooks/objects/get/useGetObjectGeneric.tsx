import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { Variables } from "graphql-request";
import { useMemo } from "react";

import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObject,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  convertAvailabilityDimensionsObjectToGQLDimensions,
  createGetObjectGenericQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { generateAvailabilityHeaders } from "src/lib/utils/request";

export interface GetObjectGenericOptions {
  uid?: string;
  externalId?: string;
  objectTypes: string[] | null;
  language?: string | null;
  availability: {
    dimensions: Record<string, string> | null;
    timeTravel: {
      datetime: string;
      timezone: string;
    } | null;
  };
  disabled?: boolean;
}

const select = (data: GQLSkylarkGetObjectResponse) => {
  const normalised = removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(
    data.getObject,
  );
  const parsedObject = parseSkylarkObject(normalised);
  console.log("SELECT RUN");
  return parsedObject;
};

export const useGetObjectGeneric = ({
  uid,
  externalId,
  objectTypes,
  language,
  availability,
  disabled,
}: GetObjectGenericOptions) => {
  const { objects: objectMeta } = useAllObjectsMeta(true);

  const { query } = useMemo(() => {
    const query = createGetObjectGenericQuery(objectMeta, {
      // typesToRequest: objectTypes || [],
      typesToRequest: [], // TODO should we ever filter out object types? even if the search tab is filtered down
    });
    return {
      query,
    };
  }, [objectMeta]);

  const dimensions = convertAvailabilityDimensionsObjectToGQLDimensions(
    availability.dimensions,
  );

  const variables: Variables = {
    uid,
    externalId,
    language: language || null,
    dimensions,
  };

  const headers = generateAvailabilityHeaders(availability);

  const { data, error, isLoading, isError, refetch, isRefetching } = useQuery<
    GQLSkylarkGetObjectResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectResponse>,
    ParsedSkylarkObject
  >({
    queryKey: [
      QueryKeys.GetObjectGeneric,
      ...Object.values(variables),
      ...Object.values(headers),
      query,
    ],
    queryFn: async () =>
      skylarkRequest("query", query as DocumentNode, variables, {}, headers),
    select,
    enabled: query !== null && (!!uid || !!externalId) && !disabled,
    retry: false,
  });

  console.log("HERE", { data, error });

  return {
    isLoading: isLoading && (!!uid || !!externalId),
    isError,
    error,
    isNotFound:
      error?.response?.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    data,
    isRefetching,
    refetch,
    graphqlQuery: {
      query,
      variables,
      headers,
    },
  };
};
