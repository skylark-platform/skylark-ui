import { graphql } from "msw";

import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";

export const deleteObjectHandlers = [
  graphql.mutation(`DELETE_Episode`, (req, res, ctx) => {
    return res(
      ctx.data({
        deleteObject: {
          uid: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid,
        },
      }),
    );
  }),
];
