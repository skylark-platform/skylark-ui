import { Flatfile } from "@flatfile/sdk";
import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import {
  createFlatfileClient,
  FlatfileClient,
} from "src/lib/graphql/flatfile/client";

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
  let flatfileClient: FlatfileClient;

  const title = "the test title";
  const synopsis = "the test synopsis";
  const slug = "the-test-slug";
  const type = "SHORT";

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
    flatfileClient = createFlatfileClient("token");

    server.use(
      graphql.mutation("createEpisode_batchId", (req, res, ctx) => {
        return res(
          ctx.data({
            createEpisode_batchId_1: {
              external_id: "external_1",
              uid: "1",
            },
            createEpisode_batchId_2: {
              external_id: "external_2",
              uid: "2",
            },
          }),
        );
      }),
    );
  });

  test("the expected result is returned", async () => {
    const got = await createFlatfileObjectsInSkylark(
      flatfileClient,
      "Episode",
      "batchId",
      flatfileRows,
    );

    expect(got).toEqual({
      data: [
        {
          external_id: "external_1",
          uid: "1",
        },
        {
          external_id: "external_2",
          uid: "2",
        },
      ],
      errors: [],
    });
  });

  // TODO add test for errors
});
