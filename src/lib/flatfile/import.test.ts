import { Flatfile } from "@flatfile/sdk";
import { gql } from "graphql-tag";
import { createMockClient, MockApolloClient } from "mock-apollo-client";

import GQLSkylarkSchemaQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/schema.json";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";

import {
  createFlatfileObjectsInSkylark,
  openFlatfileImportClient,
} from "./import";

jest.mock("@flatfile/sdk", () => {
  return {
    Flatfile: {
      requestDataFromUser: jest.fn(({ onComplete }) =>
        onComplete({ batchId: "batchId" }),
      ),
    },
  };
});

describe("openFlatfileImportClient", () => {
  test("calls requestDataFromUser with expected arguments", async () => {
    await openFlatfileImportClient("embedId", "importToken", jest.fn());

    expect(Flatfile.requestDataFromUser).toHaveBeenCalledWith(
      expect.objectContaining({
        embedId: "embedId",
        token: "importToken",
      }),
    );
  });

  test("calls onComplete argument when Flatfile has completed", async () => {
    const onComplete = jest.fn();

    await openFlatfileImportClient("embedId", "importToken", onComplete);

    expect(Flatfile.requestDataFromUser).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith("batchId");
  });
});

describe("createFlatfileObjectsInSkylark", () => {
  let mockClient: MockApolloClient;
  let schemaQueryHandler: jest.Mock;
  let createEpisodeMutationHandler: jest.Mock;

  const title = "the test title";
  const synopsis = "the test synopsis";
  const slug = "the-test-slug";
  const type = "SHORT";

  const CREATE_EPISODE_MUTATION = gql`
    mutation createEpisode_batchId {
      createEpisode_batchId_1: createEpisode(episode: { title: "${title}", synopsis: "${synopsis}", type: "${type}" }) {
        uid
        external_id
      }
      createEpisode_batchId_2: createEpisode(episode: { title: "${title}", slug: "${slug}", type: "${type}" }) {
        uid
        external_id
      }
    }
  `;

  const flatfileRows: FlatfileRow[] = [
    {
      id: 1,
      status: "completed",
      valid: true,
      data: {
        title,
        synopsis,
        type,
      },
    },
    {
      id: 2,
      status: "completed",
      valid: true,
      data: {
        title,
        slug,
        type,
      },
    },
  ];

  beforeEach(() => {
    mockClient = createMockClient();

    schemaQueryHandler = jest
      .fn()
      .mockResolvedValue(GQLSkylarkSchemaQueryFixture);
    createEpisodeMutationHandler = jest.fn().mockResolvedValue({
      data: {
        createEpisode_batchId_1: {
          external_id: "external_1",
          uid: "1",
        },
        createEpisode_batchId_2: {
          external_id: "external_2",
          uid: "2",
        },
      },
    });

    mockClient.setRequestHandler(GET_SKYLARK_SCHEMA, schemaQueryHandler);
    mockClient.setRequestHandler(
      CREATE_EPISODE_MUTATION,
      createEpisodeMutationHandler,
    );
  });

  test("both endpoints are called", async () => {
    await createFlatfileObjectsInSkylark(
      mockClient,
      "Episode",
      "batchId",
      flatfileRows,
    );

    expect(schemaQueryHandler).toHaveBeenCalled();
    expect(createEpisodeMutationHandler).toHaveBeenCalled();
  });

  test("the expected result is returned", async () => {
    const got = await createFlatfileObjectsInSkylark(
      mockClient,
      "Episode",
      "batchId",
      flatfileRows,
    );

    expect(got).toEqual([
      {
        external_id: "external_1",
        uid: "1",
      },
      {
        external_id: "external_2",
        uid: "2",
      },
    ]);
  });
});
