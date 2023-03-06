import { Flatfile } from "@flatfile/sdk";
import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import { TEMPLATE_FIELDS_TO_IGNORE } from "src/constants/flatfile";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
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
    expect(got).toEqual("string (required)\nstring1\nstring2\nstring3\n");
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
      name: type,
      isList: false,
      isRequired: false,
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
string1,10,1.2,,2023-03-06T14:39:46.000Z,2023-03-06+00:00,14:39:46.000+00:00,1678113586,customer@email.com,http://example.com,0.0.0.0,,+447975777666,true
string2,22,20.23,,2023-03-06T11:12:05.000Z,2011-02-02+00:00,14:04,-9190018725,mail@email.co.uk,https://example.com,9.255.255.255,,+12025886500,false
string3,300,0.2,,,,10:30:11,,,,21DA:D3:0:2F3B:2AA:FF:FE28:9C5A,,,
,-5,,,,,,,,,1200:0000:AB00:1234:0000:2552:7777:1313,,,
,,,,,,,,,,,,,`);
  });
});
