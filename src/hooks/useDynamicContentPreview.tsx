import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryKeys } from "src/enums/graphql";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  ParsedSkylarkObject,
  DynamicSetConfig,
  GQLSkylarkDynamicContentPreviewResponse,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createPreviewDynamicContentQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { generateAvailabilityHeaders } from "src/lib/utils/request";

export interface DynamicContentPreviewOptions {
  language: string | null;
  availability?: {
    dimensions: Record<string, string> | null;
    timeTravel: {
      datetime: string;
      timezone: string;
    } | null;
  };
}

export const createDynamicContentPreviewPrefix = ({
  dynamicSetConfig,
  language,
}: {
  dynamicSetConfig: DynamicSetConfig;
  language?: string | null;
}) => [
  QueryKeys.PreviewDynamicContent,
  JSON.stringify(dynamicSetConfig),
  { language },
];

const select = (
  data: GQLSkylarkDynamicContentPreviewResponse,
): ParsedSkylarkObject[] => {
  // const contentObjects =
  //   data?.pages?.flatMap(
  //     (page) => page.getObjectContent.content?.objects || [],
  //   ) || [];

  const parsedObjects =
    data.dynamicContentPreview?.map((obj) =>
      parseSkylarkObject(
        removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(obj),
        null,
      ),
    ) || [];

  return parsedObjects;
};

export const useDynamicContentPreview = (
  dynamicSetConfig: DynamicSetConfig,
  opts?: DynamicContentPreviewOptions,
) => {
  const { language, availability }: DynamicContentPreviewOptions = opts || {
    language: null,
  };

  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const query = createPreviewDynamicContentQuery(
    dynamicSetConfig,
    allObjectsMeta,
    dynamicSetConfig.objectTypes,
    !!language,
  );
  // const variables = { uid, language };

  const {
    data: parsedObject,
    error,
    isLoading,
    isError,
  } = useQuery<
    GQLSkylarkDynamicContentPreviewResponse,
    GQLSkylarkErrorResponse<GQLSkylarkDynamicContentPreviewResponse>,
    ParsedSkylarkObject[]
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createDynamicContentPreviewPrefix({ dynamicSetConfig, language }),
    queryFn: async () =>
      skylarkRequest(
        "query",
        query as DocumentNode,
        {},
        {},
        generateAvailabilityHeaders(availability),
      ),
    enabled: query !== null,
    select,
  });

  return {
    error,
    data: parsedObject,
    isLoading: isLoading || !query,
    isError: isError,
    query,
    // variables,
  };
};
