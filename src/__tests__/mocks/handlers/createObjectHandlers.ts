import { graphql } from "msw";

import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";

export const createObjectHandlers = [
  graphql.mutation(`CREATE_OBJECT_Episode`, (req, res, ctx) => {
    return res(
      ctx.data({
        createObject: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject,
      }),
    );
  }),
];
