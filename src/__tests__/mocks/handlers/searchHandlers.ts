import { graphql } from "msw";

import GQLSkylarkAllAvailTestMovieSearchFixture from "src/__tests__/fixtures/skylark/queries/search/fantasticMrFox_All_Availabilities.json";
import GQLGameOfThronesSearchResultsPage1 from "src/__tests__/fixtures/skylark/queries/search/gotPage1.json";
import GQLGameOfThronesSearchResultsPage1enGB from "src/__tests__/fixtures/skylark/queries/search/gotPage1enGB.json";
import GQLGameOfThronesSearchResultsPage2 from "src/__tests__/fixtures/skylark/queries/search/gotPage2.json";
import { SEARCH_PAGE_SIZE } from "src/hooks/useSearch";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

export const searchHandlers = [
  graphql.query(
    wrapQueryName("SEARCH"),
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
