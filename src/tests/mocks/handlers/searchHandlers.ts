import { graphql } from "msw";

import { SEARCH_PAGE_SIZE } from "src/hooks/useSearch";
import GQLGameOfThronesSearchResultsPage1 from "src/tests/fixtures/skylark/queries/search/gotPage1.json";
import GQLGameOfThronesSearchResultsPage2 from "src/tests/fixtures/skylark/queries/search/gotPage2.json";

export const searchHandlers = [
  graphql.query("SEARCH", ({ variables: { offset, limit } }, res, ctx) => {
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
  }),
];
