import { graphql } from "msw";

import GQLAIFieldSuggestionsGOTS01E01Fixture from "src/__tests__/fixtures/skylark/queries/ai/aiFieldSuggestions.json";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

export const aiHandlers = [
  graphql.query(wrapQueryName(`AI_FIELD_SUGGESTIONS`), (req, res, ctx) => {
    return res(ctx.data(GQLAIFieldSuggestionsGOTS01E01Fixture.data));
  }),
];
