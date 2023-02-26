import { graphql } from "msw";

import GQLSkylarkAllAvailTestMovieSearchFixture from "src/__tests__/fixtures/skylark/queries/search/allMediaTestMovieOnly.json";
import GQLGameOfThronesSearchResultsPage1 from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import GQLGameOfThronesSearchResultsPage2 from "src/__tests__/fixtures/skylark/queries/search/gotPage2.json";
import { SEARCH_PAGE_SIZE } from "src/hooks/useSearch";

export const searchHandlers = [
  graphql.query(
    "SEARCH",
    ({ variables: { offset, queryString } }, res, ctx) => {
      if (queryString === "AllAvailTestMovie") {
        return res(ctx.data(GQLSkylarkAllAvailTestMovieSearchFixture.data));
      }

      if (offset === 0) {
        return res(
          ctx.data({
            search: {
              __typename: "SearchResultListing",
              objects:
                GQLGameOfThronesSearchResultsPage1.data.search.objects.slice(
                  0,
                  SEARCH_PAGE_SIZE,
                ),
            },
          }),
        );
      }

      if (offset === SEARCH_PAGE_SIZE) {
        return res(
          ctx.data({
            search: {
              __typename: "SearchResultListing",
              objects:
                GQLGameOfThronesSearchResultsPage2.data.search.objects.slice(
                  0,
                  SEARCH_PAGE_SIZE - 1,
                ),
            },
          }),
        );
      }

      return res(
        ctx.data({
          search: {
            __typename: "SearchResultListing",
            objects: [],
          },
        }),
      );
    },
  ),
];
