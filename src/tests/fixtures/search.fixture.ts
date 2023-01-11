import { GQLSearchResponse } from "src/hooks/useSearch";
import { SkylarkGraphQLObject } from "src/interfaces/skylark/objects";

export const GQLSkylarkSearchQueryFixture = {
  search: {
    objects: Array.from(
      { length: 10 },
      (v, i) =>
        ({
          uid: "xxxx-xxxx-xxxx-xxxx",
          __typename: "Episode",
          external_id: `episode-${i}`,
          title: `Episode ${i}`,
          title_short: "Short title",
          title_long: `${"really ".repeat(5)} long title`,
          synopsis_short: "Short Synopsis",
          synopsis_long: `${"really ".repeat(10)} long synopsis`,
        } as SkylarkGraphQLObject),
    ),
  },
} as GQLSearchResponse;
