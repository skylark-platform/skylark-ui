import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useCallback } from "react";

import { REQUEST_HEADERS } from "src/constants/skylark";
import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import {
  ObjectTypesConfigObject,
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  DynamicSetConfig,
  GQLSkylarkGetObjectDynamicContentConfigurationResponse,
  DynamicSetRuleBlock,
  DynamicSetObjectRule,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetObjectDynamicContentConfigurationQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

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

const select = (
  {
    getObjectDynamicContentConfiguration: {
      dynamic_content,
      content_sort_field,
      content_sort_direction,
    },
  }: GQLSkylarkGetObjectDynamicContentConfigurationResponse,
  objectTypesConfig?: ObjectTypesConfigObject,
): DynamicSetConfig => {
  console.log("select", { dynamic_content });
  return {
    objectTypes: dynamic_content.dynamic_content_types || [],
    contentSortDirection: content_sort_direction,
    contentSortField: content_sort_field,
    ruleBlocks: dynamic_content.dynamic_content_rules
      ? dynamic_content.dynamic_content_rules.map(
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
                  relatedObjects:
                    gqlRule.objects?.map((obj) =>
                      convertParsedObjectToIdentifier(
                        parseSkylarkObject(
                          removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(
                            obj,
                          ),
                          null,
                        ),
                        objectTypesConfig,
                      ),
                    ) || [],
                  relationshipName: gqlRule.relationship_name || "",
                  relatedUid: gqlRule.uid || [],
                }),
              ),
            };
          },
        )
      : [],
  };
};

export const useGetObjectDynamicContentConfiguration = (
  objectType: SkylarkObjectType,
  uid: string,
) => {
  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const { objectTypesConfig } = useSkylarkObjectTypesWithConfig();

  const query = createGetObjectDynamicContentConfigurationQuery(
    objectType,
    allObjectsMeta,
  );
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
    select: useCallback(
      (data: GQLSkylarkGetObjectDynamicContentConfigurationResponse) =>
        select(data, objectTypesConfig),
      [objectTypesConfig],
    ),
  });

  return {
    error,
    data,
    isLoading: isLoading || !query,
    isNotFound:
      error?.response?.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    isError: isError,
    query,
    variables,
  };
};
