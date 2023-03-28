import { gql } from "graphql-tag";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import {
  NormalizedObjectFieldType,
  ParsedSkylarkObjectContentObject,
  SkylarkObjectMeta,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { generateExampleFieldData } from "src/lib/flatfile";
import { parseMetadataForGraphQLRequest } from "src/lib/skylark/parsers";

import {
  COMMON_GRAPHQL_OPTS,
  generateContentsToReturn,
  generateFieldsToReturn,
} from "./dynamicQueries";

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

export const createCreateObjectMutation = (
  objectMeta: SkylarkObjectMeta | null,
) => {
  if (!objectMeta || !objectMeta.operations.update) {
    return null;
  }

  // Until we support adding values in create, prefill any required fields - never prefill external_id
  const ignoredSystemFields: string[] = [
    SkylarkSystemField.ExternalID,
    SkylarkSystemField.DataSourceID,
    SkylarkSystemField.DataSourceFields,
  ];
  const inputs = objectMeta.operations.create.inputs.filter(
    ({ name }) => !ignoredSystemFields.includes(name),
  );
  const requiredInputs = inputs.filter(({ isRequired }) => isRequired);
  const inputsThatNeedExampleData =
    requiredInputs.length > 0 ? requiredInputs : [inputs[0]];

  const exampleData = inputsThatNeedExampleData.map((field) => {
    const exampleFieldData = generateExampleFieldData(field, 0);
    return [field.name, exampleFieldData];
  });
  const exampleDataObject = Object.fromEntries(exampleData);
  console.log({
    inputs,
    inputsThatNeedExampleData,
    exampleData,
    exampleDataObject,
  });

  const mutation = {
    mutation: {
      __name: `CREATE_OBJECT_${objectMeta.name}`,
      __variables: {
        language: "String",
      },
      createObject: {
        __aliasFor: objectMeta.operations.create.name,
        __args: {
          language: new VariableType("language"),
          [objectMeta.operations.create.argName]: exampleDataObject,
        },
        ...COMMON_GRAPHQL_OPTS.objectMeta,
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateObjectMetadataMutation = (
  objectMeta: SkylarkObjectMeta | null,
  metadata: Record<string, SkylarkObjectMetadataField>,
) => {
  if (!objectMeta || !objectMeta.operations.update) {
    return null;
  }

  const parsedMetadata = parseMetadataForGraphQLRequest(
    metadata,
    objectMeta.operations.update.inputs,
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_METADATA_${objectMeta.name}`,
      __variables: {
        uid: "String!",
      },
      updateObjectMetadata: {
        __aliasFor: objectMeta.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [objectMeta.operations.update.argName]: {
            ...parsedMetadata,
          },
        },
        uid: true,
        ...generateFieldsToReturn(objectMeta.fields),
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
