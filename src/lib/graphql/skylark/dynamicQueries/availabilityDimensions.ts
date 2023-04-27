import gql from "graphql-tag";
import { VariableType, jsonToGraphQLQuery } from "json-to-graphql-query";

import { SkylarkGraphQLAvailabilityDimension } from "src/interfaces/skylark";

const createDimensionValueNextTokenVariableName = (
  uid: SkylarkGraphQLAvailabilityDimension["uid"],
) => `nextToken_${uid}`;

export const createGetDimensionValueNextTokenVariables = (
  values: { dimensionUid: string; value: string | null }[],
) => {
  const variables = values.reduce(
    (acc, { dimensionUid, value }) => ({
      ...acc,
      [createDimensionValueNextTokenVariableName(dimensionUid)]: value,
    }),
    {},
  );
  return variables;
};

export const createGetAvailabilityDimensionValues = (
  dimensions?: SkylarkGraphQLAvailabilityDimension[],
) => {
  if (!dimensions) {
    return null;
  }

  const variables = createGetDimensionValueNextTokenVariables(
    dimensions.map(({ uid }) => ({ dimensionUid: uid, value: "String" })),
  );

  const query = {
    query: {
      __name: "LIST_AVAILABILITY_DIMENSION_VALUES",
      __variables: variables,
      ...dimensions.reduce((acc, dimension) => {
        const queryAlias = `dimension_${dimension.uid}`;
        const nextTokenVariableName = createDimensionValueNextTokenVariableName(
          dimension.uid,
        );
        return {
          ...acc,
          [queryAlias]: {
            __aliasFor: "getDimension",
            __args: {
              dimension_id: dimension.uid,
            },
            uid: true,
            values: {
              __args: {
                next_token: new VariableType(nextTokenVariableName),
                limit: 50, // max
              },
              next_token: true,
              objects: {
                uid: true,
                title: true,
                external_id: true,
                slug: true,
                description: true,
              },
            },
          },
        };
      }, {}),
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query, { pretty: true });

  return gql(graphQLQuery);
};
