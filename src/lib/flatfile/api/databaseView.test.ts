import { createFlatfileClient } from "src/lib/graphql/flatfile/client";
import { mockFlatfileGetFinalDatabaseView } from "src/tests/mocks/handlers/flatfile";

import { getFlatfileFinalDatabaseView } from "./databaseView";

test("makes a request to Flatfile with expected variables", async () => {
  const flatfileClient = createFlatfileClient("token");

  const got = await getFlatfileFinalDatabaseView(flatfileClient, "batchId");

  expect(got).toEqual(mockFlatfileGetFinalDatabaseView.getFinalDatabaseView);
});
