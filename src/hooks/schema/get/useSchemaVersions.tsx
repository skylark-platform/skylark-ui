import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkListSchemaVersionsResponse,
  GQLSkylarkSchemaVersion,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { LIST_SCHEMA_VERSIONS } from "src/lib/graphql/skylark/queries";
import { parseSchemaVersion } from "src/lib/skylark/parsers";

const select = (
  data: InfiniteData<GQLSkylarkListSchemaVersionsResponse>,
): SchemaVersion[] =>
  data?.pages
    ?.flatMap(
      (page) =>
        page.listConfigurationVersions.objects.map(parseSchemaVersion) || [],
    )
    .filter(
      ({ version }, index, arr) =>
        arr.findIndex((item) => item.version === version) == index,
    )
    .sort(({ version: va }, { version: vb }) => vb - va) || [];

export const useSchemaVersions = () => {
  const { data, hasNextPage, fetchNextPage, isLoading } = useInfiniteQuery<
    GQLSkylarkListSchemaVersionsResponse,
    GQLSkylarkErrorResponse<GQLSkylarkListSchemaVersionsResponse>,
    SchemaVersion[]
  >({
    queryKey: [QueryKeys.Schema, LIST_SCHEMA_VERSIONS],
    queryFn: async ({ pageParam: nextToken }) =>
      skylarkRequest("query", LIST_SCHEMA_VERSIONS, { nextToken }),
    initialPageParam: "",
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.listConfigurationVersions?.next_token || undefined,
    select,
  });

  if (hasNextPage) {
    fetchNextPage();
  }

  return {
    schemaVersions: data,
    isLoading,
  };
};
