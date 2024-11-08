import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { REQUEST_HEADERS } from "src/constants/skylark";
import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  DynamicSetConfig,
  GQLSkylarkGetObjectDynamicContentConfigurationResponse,
  DynamicSetRuleBlock,
  DynamicSetObjectRule,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectDynamicContentConfigurationQuery } from "src/lib/graphql/skylark/dynamicQueries";

export const createGetObjectDynamicContentConfigurationKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [
  QueryKeys.GetObjectContent,
  "dynamicContentConfiguration",
  uid,
  objectType,
];

const select = ({
  getObjectDynamicContentConfiguration: { dynamic_content },
}: GQLSkylarkGetObjectDynamicContentConfigurationResponse): DynamicSetConfig => {
  return {
    objectTypes: dynamic_content.dynamic_content_types,
    ruleBlocks: dynamic_content.dynamic_content_rules.map(
      (gqlRuleBlock): DynamicSetRuleBlock => {
        const firstRule = gqlRuleBlock?.[0];

        if (gqlRuleBlock.length < 2) {
          const emptyRules: DynamicSetObjectRule[] = [];
          return {
            objectTypesToSearch: firstRule.object_types || [],
            objectRules: emptyRules,
          };
        }

        return {
          objectTypesToSearch: firstRule.object_types,
          objectRules: gqlRuleBlock.slice(1).map(
            (gqlRule): DynamicSetObjectRule => ({
              objectType: gqlRule.object_types,
              relatedObjects: undefined,
              relationshipName: gqlRule.relationship_name || "",
              relatedUid: gqlRule.uid || [],
            }),
          ),
        };
      },
    ),
  };
};

export const useGetObjectDynamicContentConfiguration = (
  objectType: SkylarkObjectType,
  uid: string,
) => {
  const { objectOperations: objectMeta, isError: isObjectMetaError } =
    useSkylarkObjectOperations(objectType);

  const query = createGetObjectDynamicContentConfigurationQuery(objectMeta);
  const variables = { uid };

  const { data, error, isLoading, isError } = useQuery<
    GQLSkylarkGetObjectDynamicContentConfigurationResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectDynamicContentConfigurationResponse>,
    DynamicSetConfig
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectDynamicContentConfigurationKeyPrefix({
      objectType,
      uid,
    }),
    queryFn: async () =>
      skylarkRequest(
        "query",
        query as DocumentNode,
        variables,
        {},
        { [REQUEST_HEADERS.ignoreAvailability]: "true" },
      ),
    enabled: query !== null,
    select,
  });

  return {
    error,
    data,
    isLoading: (isLoading || !query) && !isObjectMetaError,
    isNotFound:
      error?.response?.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    isError: isError || isObjectMetaError,
    query,
    variables,
  };
};
