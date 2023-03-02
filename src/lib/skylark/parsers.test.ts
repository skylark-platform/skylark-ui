import { GQLInputField, GQLType } from "src/interfaces/graphql/introspection";
import { SkylarkGraphQLObject } from "src/interfaces/skylark";

import {
  parseObjectContent,
  parseObjectInputFields,
  parseObjectRelationships,
} from "./parsers";

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
        want: "timestamp",
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
              name: "episodes",
              type: {
                ...defaultType,
                name: "EpisodeRelationshipInput",
                kind: "INPUT_OBJECT",
              },
            },
            {
              name: "brands",
              type: {
                ...defaultType,
                name: "BrandRelationshipInput",
                kind: "INPUT_OBJECT",
              },
            },
          ],
        },
      },
    ];

    const got = parseObjectRelationships(fields);
    expect(got).toEqual([
      { objectType: "Episode", relationshipName: "episodes" },
      { objectType: "Brand", relationshipName: "brands" },
    ]);
  });
});

describe("parseObjectContent", () => {
  test("returns empty array when undefined is given", () => {
    const got = parseObjectContent(undefined);
    expect(got).toEqual({ objects: [] });
  });

  test("returns empty array when content.objects is empty", () => {
    const got = parseObjectContent({ objects: [] });
    expect(got).toEqual({ objects: [] });
  });

  test("parses an objects content objects", () => {
    const objects = [
      {
        position: 1,
        object: {
          __typename: "Episode",
          uid: "episode_1",
          _config: {
            colour: "black",
            primary_field: "uid",
          },
        } as SkylarkGraphQLObject,
      },
      {
        position: 2,
        object: {
          __typename: "Set",
          uid: "set_1",
        } as SkylarkGraphQLObject,
      },
    ];

    const got = parseObjectContent({
      objects,
    });
    expect(got).toEqual({
      objects: [
        {
          config: {
            colour: "black",
            primaryField: "uid",
          },
          object: objects[0].object,
          objectType: objects[0].object.__typename,
          position: 1,
        },
        {
          config: {
            colour: undefined,
            primaryField: undefined,
          },
          object: objects[1].object,
          objectType: objects[1].object.__typename,
          position: 2,
        },
      ],
    });
  });
});
