import gql from "graphql-tag";
import { VariableType } from "json-to-graphql-query";

import { MAX_GRAPHQL_LIMIT } from "src/constants/skylark";
import {
  SkylarkAvailabilityField,
  SkylarkGraphQLAvailabilityDimension,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

import {
  generateDimensionsAndValuesFieldsToReturn,
  generateFieldsToReturn,
  generateVariablesAndArgs,
  wrappedJsonQuery,
} from "./utils";

interface DimensionWithNextToken {
  dimension: SkylarkGraphQLAvailabilityDimension;
  nextToken: string;
}

export const createGetAvailabilityDimensionValuesQueryAlias = ({
  uid,
}: SkylarkGraphQLAvailabilityDimension) => `dimension_${uid}`;

export const createGetAvailabilityDimensionValues = (
  dimensions?: SkylarkGraphQLAvailabilityDimension[],
  nextTokens?: Record<string, string>,
) => {
  if (!dimensions) {
    return null;
  }

  const dimensionsWithNextTokens: DimensionWithNextToken[] = dimensions
    .map(
      (dimension) =>
        nextTokens &&
        hasProperty(nextTokens, dimension.uid) && {
          dimension,
          nextToken: nextTokens[dimension.uid],
        },
    )
    .filter(
      (item): item is DimensionWithNextToken => !!(item && item.nextToken),
    );

  const dimensionsToCreate =
    dimensionsWithNextTokens.length > 0
      ? dimensionsWithNextTokens
      : dimensions.map((dimension) => ({ dimension, nextToken: "" }));

  const query = {
    query: {
      __name: "LIST_AVAILABILITY_DIMENSION_VALUES",
      ...dimensionsToCreate.reduce((acc, { dimension, nextToken }) => {
        const queryAlias =
          createGetAvailabilityDimensionValuesQueryAlias(dimension);
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
                next_token: nextToken || null,
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

  const graphQLQuery = wrappedJsonQuery(query, { pretty: true });

  return gql(graphQLQuery);
};

export const createGetAvailabilityAssignedTo = (
  objectsToRequest: SkylarkObjectMeta[] | null,
) => {
  if (!objectsToRequest) {
    return null;
  }

  const query = {
    query: {
      __name: "GET_AVAILABILITY_ASSIGNED_TO",
      __variables: {
        uid: "String!",
        nextToken: "String",
      },
      getAvailabilityAssignedTo: {
        __aliasFor: "getAvailability",
        __args: {
          uid: new VariableType("uid"),
        },
        __typename: true,
        assigned_to: {
          __args: {
            limit: MAX_GRAPHQL_LIMIT,
            next_token: new VariableType("nextToken"),
          },
          next_token: true,
          objects: {
            inherited: true,
            inheritance_source: true,
            active: true,
            object: {
              uid: true,
              __on: objectsToRequest.map((object) => {
                const common = generateVariablesAndArgs(object.name, "Query");
                return {
                  __typeName: object.name,
                  __typename: true, // To remove the alias later
                  ...generateFieldsToReturn(
                    object.fields,
                    object.name,
                    true,
                    `__${object.name}__`,
                  ),
                  ...common.fields,
                };
              }),
            },
          },
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetAvailabilitySegmentAssignedTo = (
  availabilityObjectMeta: SkylarkObjectMeta | null,
) => {
  if (!availabilityObjectMeta) {
    return null;
  }
  const common = generateVariablesAndArgs(availabilityObjectMeta.name, "Query");

  const query = {
    query: {
      __name: "GET_AVAILABILITYSEGMENTS_ASSIGNED_TO",
      __variables: {
        uid: "String!",
        nextToken: "String",
      },
      getAvailabilitySegmentAssignedTo: {
        __aliasFor: "getAvailabilitySegment",
        __args: {
          uid: new VariableType("uid"),
        },
        __typename: true,
        assigned_to: {
          __args: {
            limit: MAX_GRAPHQL_LIMIT,
            next_token: new VariableType("nextToken"),
          },
          next_token: true,
          objects: {
            inherited: true,
            inheritance_source: true,
            active: true,
            uid: true,
            __typename: true,
            ...generateFieldsToReturn(
              availabilityObjectMeta.fields,
              availabilityObjectMeta.name,
              true,
            ),
            ...common.fields,
          },
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetAssignedDimensionsQuery = (
  objectMeta: SkylarkObjectMeta | null,
) => {
  if (!objectMeta) {
    return null;
  }

  const query = {
    query: {
      __name: `GET_${objectMeta.name}_DIMENSIONS`,
      __variables: {
        uid: "String!",
        nextToken: "String",
      },
      getObjectDimensions: {
        __aliasFor: objectMeta.operations.get.name,
        __args: {
          uid: new VariableType("uid"),
        },
        __typename: true,
        uid: true,
        [SkylarkAvailabilityField.DimensionBreakdown]: true,
        dimensions: generateDimensionsAndValuesFieldsToReturn("nextToken"),
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetAssignedSegmentsQuery = (
  objectMeta: SkylarkObjectMeta | null,
) => {
  if (!objectMeta) {
    return null;
  }

  const query = {
    query: {
      __name: `GET_${objectMeta.name}_SEGMENTS`,
      __variables: {
        uid: "String!",
        nextToken: "String",
      },
      getObjectSegments: {
        __aliasFor: objectMeta.operations.get.name,
        __args: {
          uid: new VariableType("uid"),
        },
        __typename: true,
        uid: true,
        [SkylarkAvailabilityField.DimensionBreakdown]: true,
        segments: {
          __args: {
            limit: MAX_GRAPHQL_LIMIT,
            next_token: new VariableType("nextToken"),
          },
          next_token: true,
          objects: {
            uid: true,
            title: true,
            slug: true,
            dimensions: generateDimensionsAndValuesFieldsToReturn(),
          },
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
