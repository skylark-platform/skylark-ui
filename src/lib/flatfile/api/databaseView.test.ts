import { createMockClient, MockApolloClient } from "mock-apollo-client";

import { FlatfileGetFinalDatabaseViewResponse } from "src/interfaces/flatfile/responses";
import { GET_FINAL_DATABASE_VIEW } from "src/lib/graphql/flatfile/queries";

import { getFlatfileFinalDatabaseView } from "./databaseView";

let mockClient: MockApolloClient;
let queryHandler: jest.Mock;

const data: FlatfileGetFinalDatabaseViewResponse = {
  getFinalDatabaseView: {
    rows: [
      {
        id: 1,
        status: "success",
        valid: true,
        data: {
          title: "Episode 1",
          slug: "episode-1",
        },
      },
    ],
  },
};

beforeEach(() => {
  mockClient = createMockClient();

  queryHandler = jest.fn().mockResolvedValue({
    data,
  });

  mockClient.setRequestHandler(GET_FINAL_DATABASE_VIEW, queryHandler);
});

test("makes a request to Flatfile with expected variables", async () => {
  const got = await getFlatfileFinalDatabaseView(mockClient, "batchId");

  expect(queryHandler).toHaveBeenCalledWith({ batchId: "batchId" });
  expect(got).toEqual(data.getFinalDatabaseView);
});
