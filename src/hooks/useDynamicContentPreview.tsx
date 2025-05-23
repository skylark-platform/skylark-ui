import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryKeys } from "src/enums/graphql";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  DynamicSetConfig,
  GQLSkylarkDynamicContentPreviewResponse,
  SkylarkGraphQLObject,
  SkylarkObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createPreviewDynamicContentQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
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
  disabled?: boolean;
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

const select = (data: GQLSkylarkDynamicContentPreviewResponse) => {
  // const contentObjects =
  //   data?.pages?.flatMap(
  //     (page) => page.getObjectContent.content?.objects || [],
  //   ) || [];

  const parsedObjects =
    data.dynamicContentPreview?.objects.map((obj) =>
      convertParsedObjectToIdentifier(
        parseSkylarkObject(
          removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(obj),
          null,
        ),
      ),
    ) || [];

  return {
    count: data.dynamicContentPreview.count,
    totalCount: data.dynamicContentPreview.total_count,
    objects: parsedObjects,
  };
};

export const useDynamicContentPreview = (
  dynamicSetConfig: DynamicSetConfig,
  opts?: DynamicContentPreviewOptions,
) => {
  const { language, availability, disabled }: DynamicContentPreviewOptions =
    opts || {
      language: null,
    };

  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const query = createPreviewDynamicContentQuery(
    dynamicSetConfig,
    allObjectsMeta,
    dynamicSetConfig.objectTypes,
    !!language,
  );

  const {
    data: parsedObject,
    error,
    isLoading,
    isError,
  } = useQuery<
    GQLSkylarkDynamicContentPreviewResponse,
    GQLSkylarkErrorResponse<GQLSkylarkDynamicContentPreviewResponse>,
    {
      objects: SkylarkObject[];
      count: number;
      totalCount: number;
    }
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ...createDynamicContentPreviewPrefix({ dynamicSetConfig, language }),
      availability,
    ],
    queryFn: async () =>
      skylarkRequest(
        "query",
        query as DocumentNode,
        {},
        {},
        generateAvailabilityHeaders(availability),
      ),
    enabled: query !== null && !disabled,
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
