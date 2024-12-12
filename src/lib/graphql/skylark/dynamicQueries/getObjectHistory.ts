import gql from "graphql-tag";
import { VariableType } from "json-to-graphql-query";

import { SkylarkObjectMeta } from "src/interfaces/skylark";

import { generateVariablesAndArgs, wrappedJsonQuery } from "./utils";

export const createGetObjectVersionMetadataQueryName = (objectType: string) =>
  `GET_${objectType}_VERSION_METADATA`;
export const createGetObjectVersionsQueryName = (objectType: string) =>
  `GET_${objectType}_VERSIONS`;

export const createGetObjectVersionMetadataQuery = (
  object: SkylarkObjectMeta | null,
  addLanguageVariable?: boolean,
) => {
  if (!object || !object.operations.get) {
    return null;
  }
  const common = generateVariablesAndArgs(
    object.name,
    "Query",
    addLanguageVariable,
  );

  const query = {
    query: {
      __name: createGetObjectVersionMetadataQueryName(object.name),
      __variables: {
        ...common.variables,
        uid: "String",
        externalId: "String",
        languageVersion: "Int",
        globalVersion: "Int",
      },
      getObjectVersion: {
        __aliasFor: object.operations.get.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
          external_id: new VariableType("externalId"),
        },
        __typename: true,
        _meta: {
          __args: {
            language_version: new VariableType("languageVersion"),
            global_version: new VariableType("globalVersion"),
          },
          modified: {
            date: true,
          },
          created: {
            date: true,
          },
          published: true,
          global_data: {
            version: true,
            ...object.fields.globalNames.reduce(
              (prev, field) => ({ ...prev, [field]: true }),
              {},
            ),
          },
          language_data: {
            version: true,
            ...object.fields.translatableNames.reduce(
              (prev, field) => ({ ...prev, [field]: true }),
              {},
            ),
          },
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetObjectVersionsQuery = (
  object: SkylarkObjectMeta | null,
  addLanguageVariable?: boolean,
) => {
  if (!object || !object.operations.get) {
    return null;
  }
  const common = generateVariablesAndArgs(
    object.name,
    "Query",
    addLanguageVariable,
  );

  const query = {
    query: {
      __name: createGetObjectVersionsQueryName(object.name),
      __variables: {
        ...common.variables,
        uid: "String",
        externalId: "String",
      },
      getObjectVersions: {
        __aliasFor: object.operations.get.name,
        __args: {
          ...common.args,
          uid: new VariableType("uid"),
          external_id: new VariableType("externalId"),
        },
        __typename: true,
        _meta: {
          global_data: {
            history: {
              ...object.fields.globalNames.reduce(
                (prev, field) => ({ ...prev, [field]: true }),
                {},
              ),
              version: true,
              created: {
                date: true,
                user: true,
              },
            },
          },
          language_data: {
            history: {
              ...object.fields.translatableNames.reduce(
                (prev, field) => ({ ...prev, [field]: true }),
                {},
              ),
              version: true,
              created: {
                date: true,
                user: true,
              },
            },
          },
        },
      },
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
