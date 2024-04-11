import { TEMPLATE_FIELDS_TO_IGNORE } from "src/constants/csv";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  SkylarkObjectMeta,
  NormalizedObjectFieldType,
  NormalizedObjectField,
  SkylarkObjectOperations,
} from "src/interfaces/skylark";

import { generateExampleCSV } from "./common";

describe("generateExampleCSV", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2023-03-06T14:39:46.000Z"));
  });

  it("returns null when the skylarkObjectMeta is null", () => {
    const got = generateExampleCSV(null, false, false);
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
      false,
      false,
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
      false,
      false,
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
      false,
      false,
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
    }));

    const createMutation: SkylarkObjectOperations["create"] = {
      name: "EveryObjectType",
      type: "Mutation",
      argName: "everyObjectType",
      inputs,
    };

    const relationships: SkylarkObjectMeta["relationships"] = [
      { relationshipName: "episodes", objectType: "Episode" },
      { relationshipName: "seasons", objectType: "Brand" },
    ];

    const skylarkObjectMeta = {
      operations: {
        create: createMutation,
      },
      relationships,
      hasRelationships: true,
    };
    const got = generateExampleCSV(
      skylarkObjectMeta as unknown as SkylarkObjectMeta,
      false,
      true,
    );
    const gotHeaders = got?.split("\n")[0];
    expect(gotHeaders).toEqual(
      `${types.join(",")},episodes (1),episodes (2),episodes (3),seasons (1),seasons (2),seasons (3)`,
    );
    expect(got)
      .toEqual(`string,int,float,enum,datetime,date,time,timestamp,email,url,ipaddress,json,phone,boolean,episodes (1),episodes (2),episodes (3),seasons (1),seasons (2),seasons (3)
example,10,1.2,enum1,2023-03-06T14:39:46.000Z,2023-03-06+00:00,14:39:46.000+00:00,1678113586,customer@email.com,http://example.com,0.0.0.0,,+447975777666,true
,-5,20.23,enum2,2023-03-06T11:12:05.000Z,2011-02-02+00:00,14:04,1678101125,mail@email.co.uk,https://example.com,9.255.255.255,,+12025886500,false
,,0.2,enum3,,,10:30:11,,,,21DA:D3:0:2F3B:2AA:FF:FE28:9C5A,,,
,,,,,,,,,,,,,`);
  });

  it("returns only translatable fields", () => {
    const types: Array<NormalizedObjectFieldType> = ["string", "int"];
    const inputs: NormalizedObjectField[] = types.map((type) => ({
      type,
      originalType: "" as GQLScalars,
      name: type,
      isList: false,
      isRequired: false,
      enumValues: type === "enum" ? ["enum1", "enum2", "enum3"] : undefined,
    }));

    const createMutation: SkylarkObjectOperations["create"] = {
      name: "EveryObjectType",
      type: "Mutation",
      argName: "everyObjectType",
      inputs,
    };

    const relationships: SkylarkObjectMeta["relationships"] = [
      { relationshipName: "episodes", objectType: "Episode" },
      { relationshipName: "seasons", objectType: "Brand" },
    ];

    const fieldConfig: SkylarkObjectMeta["fieldConfig"] = {
      global: ["string"],
      translatable: ["int"],
    };

    const skylarkObjectMeta = {
      operations: {
        create: createMutation,
      },
      relationships,
      hasRelationships: true,
      fieldConfig,
    };
    const got = generateExampleCSV(
      skylarkObjectMeta as unknown as SkylarkObjectMeta,
      true,
      true,
    );
    const gotHeaders = got?.split("\n")[0];
    expect(gotHeaders).toEqual(`int`);
  });
});
