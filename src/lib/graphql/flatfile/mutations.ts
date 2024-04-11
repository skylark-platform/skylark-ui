import { gql } from "graphql-tag";

import { FLATFILE_TEAM, ACTIVE_FLATFILE_ENV } from "src/constants/csv";

export const CREATE_PORTAL = gql`
  mutation CREATE_PORTAL(
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
  mutation CREATE_TEMPLATE(
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
  mutation UPDATE_PORTAL($portalId: UUID!, $templateId: ID!) {
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
  mutation UPDATE_TEMPLATE($schemaId: ID!, $schema: JsonSchemaDto!) {
    updateSchema(schemaId: $schemaId, jsonSchema: $schema) {
      name
      id
    }
  }
`;
