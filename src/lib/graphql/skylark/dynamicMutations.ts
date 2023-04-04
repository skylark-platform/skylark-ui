import { gql } from "graphql-tag";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import {
  ParsedSkylarkObject,
  ParsedSkylarkObjectContentObject,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";

import { generateContentsToReturn } from "./dynamicQueries";

interface SetContentOperation {
  operation: "link" | "unlink" | "reposition";
  uid: string;
  objectType: SkylarkObjectType;
  position: number;
}

export const createDeleteObjectMutation = (
  object: SkylarkObjectMeta | null,
) => {
  if (!object || !object.operations.delete) {
    return null;
  }

  const mutation = {
    mutation: {
      __name: `DELETE_${object.name}`,
      __variables: {
        uid: "String!",
      },
      deleteObject: {
        __aliasFor: object.operations.delete.name,
        __args: {
          uid: new VariableType("uid"),
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectContentMutation = (
  object: SkylarkObjectMeta | null,
  currentContentObjects: ParsedSkylarkObjectContentObject[],
  updatedContentObjects: ParsedSkylarkObjectContentObject[],
  contentTypesToRequest: SkylarkObjectMeta[],
) => {
  if (
    !object ||
    !object.operations.update ||
    updatedContentObjects.length === 0
  ) {
    return null;
  }

  const currentContentObjectUids = currentContentObjects.map(
    ({ object }) => object.uid,
  );
  const updatedContentObjectUids = updatedContentObjects.map(
    ({ object }) => object.uid,
  );

  const linkOrRepositionOperations = updatedContentObjects.map(
    ({ objectType, object: { uid } }, index): SetContentOperation => {
      const position = index + 1;
      if (currentContentObjectUids.includes(uid)) {
        return {
          operation: "reposition",
          objectType,
          uid,
          position,
        };
      }
      return {
        operation: "link",
        objectType,
        uid,
        position,
      };
    },
  );

  const deleteOperations = currentContentObjects
    .filter(({ object: { uid } }) => !updatedContentObjectUids.includes(uid))
    .map(({ objectType, object: { uid } }): SetContentOperation => {
      return {
        operation: "unlink",
        objectType,
        uid,
        position: -1,
      };
    });

  const objectContentOperations = [
    ...linkOrRepositionOperations,
    ...deleteOperations,
  ];

  const setContent = objectContentOperations.reduce(
    (prev, { operation, objectType, uid, position }) => {
      const updatedOperations = prev[objectType] || {
        link: [],
        unlink: [],
        reposition: [],
      };

      if (operation === "unlink") {
        updatedOperations.unlink.push(uid);
      } else {
        updatedOperations[operation].push({ uid, position });
      }

      return {
        ...prev,
        [objectType]: updatedOperations,
      };
    },
    {} as Record<
      string,
      {
        link: { uid: string; position: number }[];
        unlink: string[];
        reposition: { uid: string; position: number }[];
      }
    >,
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_CONTENT_${object.name}`,
      __variables: {
        uid: "String!",
      },
      updateObjectContent: {
        __aliasFor: object.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [object.operations.update.argName]: {
            content: setContent,
          },
        },
        uid: true,
        ...generateContentsToReturn(object, contentTypesToRequest),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectRelationshipsMutation = (
  object: SkylarkObjectMeta | null,
  relationships: ParsedSkylarkObject[],
  relationshipsToRemove: any,
) => {
  if (!object || !object.operations.update || relationships.length === 0) {
    return null;
  }

  const linkRelationships = relationships.map(
    (relationship) => relationship.uid,
  );

  const relationshipsParsed = relationships.reduce(
    (prev, { objectType, uid }) => {
      const updatedOperations = prev[objectType] || {
        link: [],
        unlink: [],
        reposition: [],
      };

      return {
        ...prev,
        [objectType]: updatedOperations,
      };
    },
    {} as Record<
      string,
      {
        link: { uid: string; position: number }[];
        unlink: string[];
        reposition: { uid: string; position: number }[];
      }
    >,
  );

  console.log("||| - - ", object);
  console.log("||| - - #2", relationships);

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_CONTENT_${object.name}`,
      __variables: {
        uid: "String!",
      },
      updateObjectContent: {
        __aliasFor: object.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [object.name.toLowerCase()]: {
            relationships: {
              //TODO
              assets: {
                link: linkRelationships,
              },
            },
          },
        },
        uid: true,

        // TODO ...generateContentsToReturn(object, contentTypesToRequest),
      },
    },
  };

  console.log(mutation);

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};
