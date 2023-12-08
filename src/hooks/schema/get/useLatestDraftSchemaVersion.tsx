import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkListConfigurationVersions,
} from "src/interfaces/skylark";
import { SchemaVersionInfo } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { LIST_SCHEMA_VERSIONS } from "src/lib/graphql/skylark/queries";

const select = (
  data: GQLSkylarkListConfigurationVersions,
): SchemaVersionInfo => {
  const { objects } = data.listConfigurationVersions;

  const activeObject =
    objects.find(({ active, published }) => active && published) ||
    objects[objects.length - 1];

  const draftObjectsBasedOnActive = objects
    .filter(
      ({ base_version, published }) =>
        base_version === activeObject.version && !published,
    )
    .sort((a, b) => b.version - a.version);
  const latestDraftObject = draftObjectsBasedOnActive[0] || activeObject;

  return {
    baseVersion: latestDraftObject.base_version,
    version: latestDraftObject.version,
    active: latestDraftObject.active,
    published: latestDraftObject.published,
  };
};

export const useLatestDraftSchemaVersion = () => {
  const { data, isLoading } = useQuery<
    GQLSkylarkListConfigurationVersions,
    GQLSkylarkErrorResponse,
    SchemaVersionInfo
  >({
    queryKey: [QueryKeys.Schema, LIST_SCHEMA_VERSIONS],
    queryFn: async () => skylarkRequest("query", LIST_SCHEMA_VERSIONS),
    select,
  });

  return {
    isLoading,
    schemaVersion: data,
  };
};
