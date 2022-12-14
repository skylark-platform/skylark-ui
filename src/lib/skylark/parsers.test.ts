import { GQLInputField, GQLType } from "src/interfaces/graphql/introspection";

import { parseObjectInputFields, parseObjectRelationships } from "./parsers";

const defaultType: GQLType = {
  __typename: "",
  kind: "SCALAR",
  name: "String",
  enumValues: null,
  fields: [],
  inputFields: [],
  ofType: null,
};

describe("parseObjectInputFields", () => {
  describe("tests the field type parser", () => {
    [
      {
        input: "String",
        want: "string",
      },
      {
        input: "AWSTimestamp",
        want: "time",
      },
      {
        input: "AWSTime",
        want: "time",
      },
      {
        input: "AWSDate",
        want: "date",
      },
      {
        input: "AWSDateTime",
        want: "datetime",
      },
      {
        input: "AWSEmail",
        want: "email",
      },
      {
        input: "AWSPhone",
        want: "phone",
      },
      {
        input: "Int",
        want: "int",
      },
      {
        input: "Float",
        want: "float",
      },
      {
        input: "Float",
        want: "float",
      },
      {
        input: "Boolean",
        want: "boolean",
      },
      {
        input: "UnknownInput",
        want: "string",
      },
      {
        input: null,
        want: "string",
      },
    ].forEach(({ input, want }) =>
      test(`parses a ${input} to be a ${want}`, () => {
        const fields: GQLInputField = {
          name: "Test",
          type: {
            ...defaultType,
            name: input,
          },
        };

        const [{ type: got }] = parseObjectInputFields([fields]);
        expect(got).toEqual(want);
      }),
    );
  });

  test("returns an empty array when inputFields is undefined", () => {
    const got = parseObjectInputFields(undefined);
    expect(got).toEqual([]);
  });

  test("parses the type from the ofType field when it is given", () => {
    const fields: GQLInputField = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "SCALAR",
        name: "String",
        ofType: {
          ...defaultType,
          name: "Boolean",
        },
      },
    };

    const got = parseObjectInputFields([fields]);
    expect(got).toEqual([
      {
        enumValues: undefined,
        isList: false,
        isRequired: false,
        name: "Test",
        type: "boolean",
      },
    ]);
  });

  test("marks the field as required when the kind is NON_NULL", () => {
    const fields: GQLInputField = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "NON_NULL",
        name: "String",
      },
    };

    const got = parseObjectInputFields([fields]);
    expect(got).toEqual([
      {
        enumValues: undefined,
        isList: false,
        isRequired: true,
        name: "Test",
        type: "string",
      },
    ]);
  });

  test("marks the field as a list when the kind is LIST", () => {
    const fields: GQLInputField = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "LIST",
        name: "String",
      },
    };

    const got = parseObjectInputFields([fields]);
    expect(got).toEqual([
      {
        enumValues: undefined,
        isList: true,
        isRequired: false,
        name: "Test",
        type: "string",
      },
    ]);
  });

  test("parsers an enum input", () => {
    const fields: GQLInputField = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "ENUM",
        name: "String",
        enumValues: [{ name: "ENUM1" }, { name: "ENUM2" }],
      },
    };

    const got = parseObjectInputFields([fields]);
    expect(got).toEqual([
      {
        enumValues: ["ENUM1", "ENUM2"],
        isList: false,
        isRequired: false,
        name: "Test",
        type: "enum",
      },
    ]);
  });
});

describe("parseObjectRelationships", () => {
  test("returns the names of the relationships", () => {
    const fields: GQLInputField[] = [
      {
        name: "relationships",
        type: {
          ...defaultType,
          inputFields: [
            {
              name: "episode",
              type: defaultType,
            },
            {
              name: "brand",
              type: defaultType,
            },
          ],
        },
      },
    ];

    const got = parseObjectRelationships(fields);
    expect(got).toEqual(["episode", "brand"]);
  });
});
