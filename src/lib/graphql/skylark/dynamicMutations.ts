import { gql } from "graphql-tag";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import { groupObjectsByRelationship } from "src/components/panel/panelSections/panelRelationships.component";
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
  newRelationshipObjects: ParsedSkylarkObject[],
  removedRelationshipObjects: { [key: string]: string[] },
) => {
  if (
    !object ||
    !object.operations.update ||
    newRelationshipObjects.length === 0
  ) {
    return null;
  }

  const relationships = object?.relationships || [];

  const groupedNewRelationshipObjects = groupObjectsByRelationship(
    newRelationshipObjects,
    relationships,
  );

  const relationshipsWithChanges = relationships.filter(
    ({ relationshipName }) =>
      Object.keys(removedRelationshipObjects).includes(relationshipName) ||
      Object.keys(groupedNewRelationshipObjects).includes(relationshipName),
  );

  const linkRelationships = newRelationshipObjects.map(
    (relationship) => relationship.uid,
  );

  const parsedRelationsToUpdate = relationshipsWithChanges.reduce(
    (acc, { relationshipName }) => {
      const update = {
        [relationshipName]: {
          // at this point one of them can be undefined. TODO
          unlink: removedRelationshipObjects[relationshipName],
          link: groupedNewRelationshipObjects[relationshipName]?.map(
            (obj) => obj.uid,
          ),
        },
      };
      return { ...acc, ...update };
    },
    {},
  );

  console.log(" %%%%% parsedRelationsToUpdate", parsedRelationsToUpdate);

  const parsedRelationsToremove = Object.keys(
    removedRelationshipObjects,
  ).reduce((acc, cv) => {
    const unlink = { [cv]: { unlink: removedRelationshipObjects[cv] } };
    return { ...acc, ...unlink };
  }, {});

  console.log(
    "want to remove this",
    removedRelationshipObjects,
    parsedRelationsToremove,
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
          [object.name.toLowerCase()]: {
            relationships: {
              //TODO
              assets: {
                link: linkRelationships,
              },
              ...parsedRelationsToremove,
            },
          },
        },
        uid: true,

        // TODO ...generateContentsToReturn(object, contentTypesToRequest),
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};
