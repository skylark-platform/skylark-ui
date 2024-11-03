import { gql } from "graphql-tag";
import { VariableType } from "json-to-graphql-query";

import {
  DynamicSetConfig,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";

import { createDynamicSetContentInput } from "src/lib/graphql/skylark/dynamicMutations/objects";
import {
  generateAvailabilityRelationshipFields,
  generateFieldsToReturn,
  generateVariablesAndArgs,
  wrappedJsonQuery,
} from "./utils";

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
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
