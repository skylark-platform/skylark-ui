import { Flatfile } from "@flatfile/sdk";
import { GraphQLClient } from "graphql-request";
import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import { TEMPLATE_FIELDS_TO_IGNORE } from "src/constants/flatfile";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  NormalizedObjectField,
  NormalizedObjectFieldType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
} from "src/interfaces/skylark";
import {
  createFlatfileClient,
  FlatfileClient,
} from "src/lib/graphql/flatfile/client";
import { createSkylarkClient } from "src/lib/graphql/skylark/client";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

import {
  createFlatfileObjectsInSkylark,
  generateExampleCSV,
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

describe("generateExampleCSV", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2023-03-06T14:39:46.000Z"));
  });

  it("returns null when the skylarkObjectMeta is null", () => {
    const got = generateExampleCSV(null);
    expect(got).toBeNull();
  });

  it("returns null when the no create inputs exist", () => {
    const skylarkObjectMeta = {
      operations: {
        create: {
          name: "EveryObjectType",
          type: "Mutation",
          argName: "everyObjectType",
          inputs: [],
        },
      },
    };
    const got = generateExampleCSV(
      skylarkObjectMeta as unknown as SkylarkObjectMeta,
    );
    expect(got).toBeNull();
  });

  it("doesn't add inputs in TEMPLATE_FIELDS_TO_IGNORE", () => {
    const skylarkObjectMeta = {
      operations: {
        create: {
          name: "EveryObjectType",
          type: "Mutation",
          argName: "everyObjectType",
          inputs: [
            {
              type: "string",
              name: TEMPLATE_FIELDS_TO_IGNORE[0],
              isList: false,
              isRequired: true,
            },
          ],
        },
      },
    };
    const got = generateExampleCSV(
      skylarkObjectMeta as unknown as SkylarkObjectMeta,
    );
    expect(got).toBeNull();
  });

  it("adds required to the column when the input is required", () => {
    const skylarkObjectMeta = {
      operations: {
        create: {
          name: "EveryObjectType",
          type: "Mutation",
          argName: "everyObjectType",
          inputs: [
            {
              type: "string",
              name: "string",
              isList: false,
              isRequired: true,
            },
          ],
        },
      },
    };
    const got = generateExampleCSV(
      skylarkObjectMeta as unknown as SkylarkObjectMeta,
    );
    expect(got).toEqual("string (required)\nexample\n");
  });

  it("returns all exampleData when the object has all field types", () => {
    const types: Array<NormalizedObjectFieldType> = [
      "string",
      "int",
      "float",
      "enum",
      "datetime",
      "date",
      "time",
      "timestamp",
      "email",
      "url",
      "ipaddress",
      "json",
      "phone",
      "boolean",
    ];
    const inputs: NormalizedObjectField[] = types.map((type) => ({
      type,
      originalType: "" as GQLScalars,
      name: type,
      isList: false,
      isRequired: false,
      enumValues: type === "enum" ? ["enum1", "enum2", "enum3"] : undefined,
      isGlobal: true,
      isTranslatable: false,
      isUnversioned: false,
    }));

    const createMutation: SkylarkObjectOperations["create"] = {
      name: "EveryObjectType",
      type: "Mutation",
      argName: "everyObjectType",
      inputs,
    };

    const skylarkObjectMeta = {
      operations: {
        create: createMutation,
      },
    };
    const got = generateExampleCSV(
      skylarkObjectMeta as unknown as SkylarkObjectMeta,
    );
    const gotHeaders = got?.split("\n")[0];
    expect(gotHeaders).toEqual(types.join(","));
    expect(got)
      .toEqual(`string,int,float,enum,datetime,date,time,timestamp,email,url,ipaddress,json,phone,boolean
example,10,1.2,enum1,2023-03-06T14:39:46.000Z,2023-03-06+00:00,14:39:46.000+00:00,1678113586,customer@email.com,http://example.com,0.0.0.0,,+447975777666,true
,-5,20.23,enum2,2023-03-06T11:12:05.000Z,2011-02-02+00:00,14:04,1678101125,mail@email.co.uk,https://example.com,9.255.255.255,,+12025886500,false
,,0.2,enum3,,,10:30:11,,,,21DA:D3:0:2F3B:2AA:FF:FE28:9C5A,,,
,,,,,,,,,,,,,`);
  });
});
