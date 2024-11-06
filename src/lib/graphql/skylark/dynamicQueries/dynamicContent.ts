import { count } from "console";
import { gql } from "graphql-tag";
import { EnumType, VariableType } from "json-to-graphql-query";

import {
  DynamicSetConfig,
  SkylarkDynamicSetInput,
  SkylarkDynamicSetRuleBlock,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";

import {
  generateAvailabilityRelationshipFields,
  generateFieldsToReturn,
  generateVariablesAndArgs,
  wrappedJsonQuery,
} from "./utils";

export const createDynamicSetContentInput = (
  dynamicSetConfig: DynamicSetConfig,
): SkylarkDynamicSetInput => {
  return {
    dynamic_content_types: dynamicSetConfig.objectTypes.map(
      (str) => new EnumType(str),
    ),
    dynamic_content_rules: dynamicSetConfig.ruleBlocks.map(
      (ruleBlock): SkylarkDynamicSetInput["dynamic_content_rules"][0] => {
        const firstRule = {
          object_types: ruleBlock.objectTypesToSearch.map(
            (ot) => new EnumType(ot),
          ),
        };

        const otherRules = ruleBlock.objectRules.map(
          (rule): SkylarkDynamicSetRuleBlock => {
            const uids = [
              ...new Set([
                ...(rule.relatedUid || []),
                ...(rule.relatedObjects?.map(({ uid }) => uid) || []),
              ]),
            ];

            return {
              object_types: rule.objectType.map((ot) => new EnumType(ot)),
              relationship_name: rule.relationshipName,
              uid: uids.length > 0 ? uids : null,
            };
          },
        );

        return [firstRule, ...otherRules];
      },
    ),
  };
};

export const createPreviewDynamicContentQuery = (
  dynamicSetConfig: DynamicSetConfig,
  allObjectsMeta: SkylarkObjectMeta[] | null,
  objectTypesToRequest: SkylarkObjectType[],
  addLanguageVariable?: boolean,
  opts?: { fetchAvailability?: boolean },
) => {
  if (
    !dynamicSetConfig ||
    dynamicSetConfig.objectTypes.length === 0 ||
    !allObjectsMeta
  ) {
    return null;
  }
  // const common = generateVariablesAndArgs(
  //   object.name,
  //   "Query",
  //   addLanguageVariable,
  // );

  const query = {
    query: {
      __name: "GET_DYNAMIC_CONTENT_PREVIEW",
      __variables: {
        // ...common.variables,
        // nextToken: "String",
      },
      dynamicContentPreview: {
        __args: {
          // ...common.args,
          rules: createDynamicSetContentInput(dynamicSetConfig),
        },
        count: true,
        total_count: true,
        objects: {
          __typename: true,
          uid: true,
          __on: (objectTypesToRequest && objectTypesToRequest.length > 0
            ? allObjectsMeta.filter(({ name }) =>
                objectTypesToRequest.includes(name),
              )
            : allObjectsMeta
          ).map((object) => ({
            __typeName: object.name,
            __typename: true, // To remove the alias later
            // ...common.fields,
            ...generateFieldsToReturn(
              object.fields,
              object.name,
              true,
              `__${object.name}__`,
            ),
            ...(opts?.fetchAvailability && object.availability
              ? {
                  availability: generateAvailabilityRelationshipFields(
                    object.availability,
                  ),
                }
              : {}),
          })),
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
