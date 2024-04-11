import { Flatfile } from "@flatfile/sdk";
import { GraphQLClient } from "graphql-request";
import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import {
  createFlatfileClient,
  FlatfileClient,
} from "src/lib/graphql/flatfile/client";
import { createSkylarkClient } from "src/lib/graphql/skylark/client";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

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
  let skylarkClient: GraphQLClient;

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
        date: "",
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
    skylarkClient = createSkylarkClient("http://localhost:3000", "token");

    server.use(
      graphql.mutation(
        wrapQueryName("FLATFILE_IMPORT_EPISODE_BATCHID"),
        (req, res, ctx) => {
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
        },
      ),
    );
  });

  test("the expected result is returned", async () => {
    const got = await createFlatfileObjectsInSkylark(
      skylarkClient,
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

  test("throws an error when a date is an invalid format", async () => {
    await expect(
      createFlatfileObjectsInSkylark(skylarkClient, "Episode", "batchId", [
        {
          id: 1,
          status: "completed",
          valid: true,
          data: {
            release_date: "invalidformat",
          },
        },
      ]),
    ).rejects.toThrow(
      'Value given for date is an invalid format: "invalidformat". Valid formats: "YYYY-MM-DD", "YYYY-MM-DDZ", "DD/MM/YYYY"',
    );
  });

  test("errors are returned", async () => {
    const errors = [
      {
        path: ["createEveryFieldType_d021204b_9165_4eb9_92b2_d9b82e32d469_1"],
        data: null,
        errorType: "TypeError",
        errorInfo: null,
        locations: [{ line: 2, column: 5, sourceName: null }],
        message:
          "Unexpected type <class 'int'> for attribute timestamp. Expected <class 'str'>",
      },
      {
        path: ["createEveryFieldType_d021204b_9165_4eb9_92b2_d9b82e32d469_2"],
        data: null,
        errorType: "TypeError",
        errorInfo: null,
        locations: [{ line: 6, column: 5, sourceName: null }],
        message:
          "Unexpected type <class 'int'> for attribute timestamp. Expected <class 'str'>",
      },
      {
        path: ["createEveryFieldType_d021204b_9165_4eb9_92b2_d9b82e32d469_3"],
        data: null,
        errorType: "ExternalIDException",
        errorInfo: null,
        locations: [{ line: 10, column: 5, sourceName: null }],
        message: "External ID string3 already exists",
      },
    ];
    server.use(
      graphql.mutation(
        wrapQueryName("FLATFILE_IMPORT_EPISODE_BATCHID"),
        (req, res, ctx) => {
          return res(ctx.errors(errors));
        },
      ),
    );

    const got = await createFlatfileObjectsInSkylark(
      flatfileClient,
      "Episode",
      "batchId",
      flatfileRows,
    );

    expect(got.data).toEqual([]);
    expect(got.errors.length).toEqual(3);
    expect(got.errors).toEqual(errors);
  });
});
