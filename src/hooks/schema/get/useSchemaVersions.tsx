import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkListSchemaVersionsResponse,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { LIST_SCHEMA_VERSIONS } from "src/lib/graphql/skylark/queries";

const select = (
  data: InfiniteData<GQLSkylarkListSchemaVersionsResponse>,
): SchemaVersion[] =>
  data?.pages
    ?.flatMap(
      (page) =>
        page.listConfigurationVersions.objects.map(
          ({ active, version, base_version, published }): SchemaVersion => ({
            active,
            version,
            baseVersion: base_version,
            published,
          }),
        ) || [],
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
    queryFn: async () => skylarkRequest("query", LIST_SCHEMA_VERSIONS),
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
