import { gql } from "@apollo/client";
import { ACTIVE_FLATFILE_ENV, FLATFILE_TEAM } from "src/constants/flatfile";

export const GET_PORTALS = gql`
  query(
    $searchQuery: String
  ) {
    getEmbeds(
      teamId: ${FLATFILE_TEAM}
      environmentId: "${ACTIVE_FLATFILE_ENV}"
      archived: false,
      search: $searchQuery
    ) {
      pagination {
        nextOffset
        offset
        onPage
        previousOffset
      }
      data {
          id
          name
          schemas {
            id
            name
          }
      }
    }
  }
`;

export const GET_TEMPLATES = gql`
  query(
    $searchQuery: String
  ) {
    getSchemas(
      teamId: ${FLATFILE_TEAM}
      environmentId: "${ACTIVE_FLATFILE_ENV}"
      archived: false,
      search: $searchQuery
    ) {
      pagination {
        nextOffset
        offset
        onPage
        previousOffset
      }
      data {
          id
          name
      }
    }
  }
`;

export const GET_FINAL_DATABASE_VIEW = gql`
  query ($batchId: UUID!) {
    getFinalDatabaseView(batchId: $batchId, limit: 1000000) {
      rows
    }
  }
`;
