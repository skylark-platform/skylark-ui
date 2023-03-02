import { mockFlatfileGetFinalDatabaseView } from "src/__tests__/mocks/handlers/flatfile";
import { createFlatfileClient } from "src/lib/graphql/flatfile/client";

import { getFlatfileFinalDatabaseView } from "./databaseView";

test("makes a request to Flatfile with expected variables", async () => {
  const flatfileClient = createFlatfileClient("token");

  const got = await getFlatfileFinalDatabaseView(flatfileClient, "batchId");

  expect(got).toEqual(mockFlatfileGetFinalDatabaseView.getFinalDatabaseView);
});
