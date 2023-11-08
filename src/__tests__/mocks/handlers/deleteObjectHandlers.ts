import { graphql } from "msw";

import GQLSkylarkBatchDeleteObjectsFixture from "src/__tests__/fixtures/skylark/mutations/batchDeleteObjects.json";
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

  graphql.mutation(`BATCH_DELETE`, (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkBatchDeleteObjectsFixture));
  }),
];
