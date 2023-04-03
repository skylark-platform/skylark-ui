import { EnumType } from "json-to-graphql-query";

import { GQLInputField, GQLType } from "src/interfaces/graphql/introspection";
import {
  AvailabilityStatus,
  NormalizedObjectFieldType,
  ParsedSkylarkObject,
  SkylarkGraphQLObject,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";

import {
  parseInputFieldValue,
  parseObjectContent,
  parseObjectInputFields,
  parseObjectRelationships,
  parseSkylarkObject,
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
        input: "AWSURL",
        want: "url",
      },
      {
        input: "AWSIPAddress",
        want: "ipaddress",
      },
      {
        input: "AWSJSON",
        want: "json",
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
        originalType: "Boolean",
      },
    ]);
  });

  test("marks the field as required when the kind is NON_NULL", () => {
    const fields: GQLInputField = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "NON_NULL",
        name: "String!",
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
        originalType: "String!",
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
        originalType: "String",
      },
    ]);
  });

  test("parses an enum input", () => {
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
        originalType: "String",
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
          __typename: "SkylarkSet",
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

describe("parseSkylarkObject", () => {
  it("should parse skylark object", () => {
    const skylarkObject: SkylarkGraphQLObject = {
      __typename: "Season",
      _config: {
        primary_field: "title",
        colour: "#9c27b0",
      },
      _meta: {
        available_languages: ["en-GB", "pt-PT"],
        language_data: {
          language: "pt-PT",
          version: 1,
        },
        global_data: {
          version: 2,
        },
      },
      uid: "uid123",
      external_id: "",
      slug: "uid123-s02",
      synopsis_long: null,
      synopsis_medium: null,
      synopsis_short: null,
      title: "GOT S02",
      title_long: null,
      title_medium: "Game of Thrones - Season 2",
      title_short: "GOT Season 2",
      number_of_episodes: null,
      release_date: "2012-04-01",
      season_number: 2,
      availability: {
        next_token: null,
        objects: [],
      },
      images: {
        next_token: null,
        objects: [],
      },
    };

    const expectedParsedObject: ParsedSkylarkObject = {
      objectType: "Season",
      uid: "uid123",
      config: {
        colour: "#9c27b0",
        primaryField: "title",
      },
      meta: {
        language: "pt-PT",
        availableLanguages: ["en-GB", "pt-PT"],
        versions: {
          language: 1,
          global: 2,
        },
      },
      metadata: {
        uid: "uid123",
        __typename: "Season",
        external_id: "",
        number_of_episodes: null,
        release_date: "2012-04-01",
        season_number: 2,
        slug: "uid123-s02",
        synopsis_long: null,
        synopsis_medium: null,
        synopsis_short: null,
        title: "GOT S02",
        title_long: null,
        title_medium: "Game of Thrones - Season 2",
        title_short: "GOT Season 2",
      },
      availability: {
        status: AvailabilityStatus.Unavailable,
        objects: [],
      },
      images: [],
      content: undefined,
    };

    expect(parseSkylarkObject(skylarkObject)).toEqual(expectedParsedObject);
  });
});

describe("parseInputFieldValue", () => {
  const tests: {
    input: string | number | boolean | string[];
    type: NormalizedObjectFieldType;
    want: SkylarkObjectMetadataField | EnumType;
  }[] = [
    {
      input: "",
      type: "string",
      want: null,
    },
    {
      input: "Value1",
      type: "enum",
      want: new EnumType("Value1"),
    },
    {
      input: "2020-03-12T16:30:00",
      type: "datetime",
      want: "2020-03-12T16:30:00.000Z",
    },
    {
      input: "2020-03-12",
      type: "date",
      want: "2020-03-12+00:00",
    },
    {
      input: "2020-03-12+00:00",
      type: "date",
      want: "2020-03-12+00:00",
    },
    {
      input: "2020/03/12",
      type: "date",
      want: "2020-03-12+00:00",
    },
    {
      input: "12:30:31",
      type: "time",
      want: "12:30:31.000+01:00",
    },
    {
      input: "12:30",
      type: "time",
      want: "12:30:00.000+01:00",
    },
    {
      input: "12:30:31+00:00",
      type: "time",
      want: "12:30:31.000+01:00",
    },
    {
      input: "12:30+00:00",
      type: "time",
      want: "12:30:00.000+01:00",
    },
    {
      input: "1410715640579",
      type: "timestamp",
      want: 1410715640579,
    },
    {
      input: "1410715640.579",
      type: "timestamp",
      want: 1410715640,
    },
    {
      input: "1",
      type: "int",
      want: 1,
    },
    {
      input: "1.1",
      type: "int",
      want: 1,
    },
    {
      input: "1.1",
      type: "float",
      want: 1.1,
    },
    {
      input: "{}",
      type: "json",
      want: "{}",
    },
    {
      input: "other",
      type: "email",
      want: "other",
    },
  ];

  tests.forEach(({ input, type, want }) => {
    it(`returns ${want} when input is ${input} and type is ${type}`, () => {
      const got = parseInputFieldValue(input, type);
      expect(got).toEqual(want);
    });
  });
});
