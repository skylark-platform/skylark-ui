import { graphql } from "msw";

import GQLSkylarkAllAvailTestMovieSearchFixture from "src/__tests__/fixtures/skylark/queries/search/allMediaTestMovieOnly.json";
import GQLGameOfThronesSearchResultsPage1 from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import GQLGameOfThronesSearchResultsPage1enGB from "src/__tests__/fixtures/skylark/queries/search/gotPage1enGB.json";
import GQLGameOfThronesSearchResultsPage2 from "src/__tests__/fixtures/skylark/queries/search/gotPage2.json";
import { SEARCH_PAGE_SIZE } from "src/hooks/useSearch";

export const searchHandlers = [
  graphql.query(
    "SEARCH",
    ({ variables: { offset, queryString, language } }, res, ctx) => {
      if (queryString === "AllAvailTestMovie") {
        return res(ctx.data(GQLSkylarkAllAvailTestMovieSearchFixture.data));
      }

      if (language === "en-GB") {
        return res(ctx.data(GQLGameOfThronesSearchResultsPage1enGB.data));
      }

      if (offset === 0) {
        return res(ctx.data(GQLGameOfThronesSearchResultsPage1.data));
      }

      if (offset === SEARCH_PAGE_SIZE) {
        return res(ctx.data(GQLGameOfThronesSearchResultsPage2.data));
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
