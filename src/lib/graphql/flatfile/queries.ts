import { gql } from "graphql-tag";

import { ACTIVE_FLATFILE_ENV, FLATFILE_TEAM } from "src/constants/csv";

export const GET_PORTALS = gql`
  query GET_PORTALS(
    $searchQuery: String
  ) {
    getEmbeds(
      teamId: ${FLATFILE_TEAM}
      environmentId: "${ACTIVE_FLATFILE_ENV}"
      archived: false,
      search: $searchQuery
    ) {
      data {
        id
        name
      }
    }
  }
`;

export const GET_TEMPLATES = gql`
  query GET_TEMPLATES(
    $searchQuery: String
  ) {
    getSchemas(
      teamId: ${FLATFILE_TEAM}
      environmentId: "${ACTIVE_FLATFILE_ENV}"
      archived: false,
      search: $searchQuery
    ) {
      data {
          id
          name
      }
    }
  }
`;

export const GET_FINAL_DATABASE_VIEW = gql`
  query GET_FINAL_DATABASE_VIEW(
    $batchId: UUID!
    $limit: Int!
    $offset: Int = 0
  ) {
    getFinalDatabaseView(
      status: "accepted"
      batchId: $batchId
      limit: $limit
      skip: $offset
    ) {
      totalRows
      rows
    }
  }
`;
