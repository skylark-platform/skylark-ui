import { gql } from "@apollo/client";

import { FLATFILE_TEAM, ACTIVE_FLATFILE_ENV } from "src/constants/flatfile";

export const CREATE_PORTAL = gql`
  mutation(
    $name: String!
    $templateId: ID!
  ) {
    createEmbed(
      teamId: ${FLATFILE_TEAM}
      environmentId: "${ACTIVE_FLATFILE_ENV}"
      schemaIds: [$templateId]
      name: $name
    ) {
      embed {
        name
        id
        privateKey {
          id
          scope
          key
        }
      }
    }
  }
`;

export const CREATE_TEMPLATE = gql`
  mutation(
    $name: String!
    $schema: JsonSchemaDto!
  ) {
    createSchema(
      teamId: ${FLATFILE_TEAM}
      environmentId: "${ACTIVE_FLATFILE_ENV}"
      jsonSchema: $schema
      name: $name
    ) {
      name
      id
    }
  }
`;

export const UPDATE_PORTAL = gql`
  mutation ($portalId: UUID!, $templateId: ID!) {
    updateEmbed(embedId: $portalId, schemaIds: [$templateId]) {
      name
      id
      privateKey {
        id
        scope
        key
      }
    }
  }
`;

export const UPDATE_TEMPLATE = gql`
  mutation ($schemaId: ID!, $schema: JsonSchemaDto!) {
    updateSchema(schemaId: $schemaId, jsonSchema: $schema) {
      name
      id
    }
  }
`;
