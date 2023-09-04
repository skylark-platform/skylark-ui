import {
  IntrospectionEnumValue,
  IntrospectionField,
  IntrospectionInputValue,
} from "graphql";
import { EnumType } from "json-to-graphql-query";

import {
  AvailabilityStatus,
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  NormalizedObjectFieldType,
  ParsedSkylarkObject,
  ParsedSkylarkObjectRelationships,
  SkylarkAvailabilityField,
  SkylarkGraphQLObject,
  SkylarkObjectMetadataField,
  SkylarkObjectRelationship,
  SkylarkSystemField,
} from "src/interfaces/skylark";

import { AWS_EARLIEST_DATE, AWS_LATEST_DATE } from "./availability";
import {
  parseInputFieldValue,
  parseMetadataForGraphQLRequest,
  parseMetadataForHTMLForm,
  parseObjectContent,
  parseObjectInputFields,
  parseObjectRelationships,
  parseSkylarkObject,
  parseUpdatedRelationshipObjects,
} from "./parsers";

const defaultType = {
  __typename: "",
  kind: "SCALAR",
  name: "String",
  enumValues: null,
  fields: [],
  inputFields: [],
  ofType: null,
};

describe("parseObjectInputFields", () => {
  const objectType = "Episode";
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
        const fields = {
          name: "Test",
          type: {
            ...defaultType,
            name: input,
          },
        };

        const [{ type: got }] = parseObjectInputFields(
          objectType,
          [fields] as unknown as IntrospectionField[],
          {},
        );
        expect(got).toEqual(want);
      }),
    );
  });

  test("parses the type from the ofType field when it is given", () => {
    const fields = {
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

    const got = parseObjectInputFields(
      objectType,
      [fields] as unknown as IntrospectionField[],
      {},
    );
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
    const fields = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "NON_NULL",
        name: "String",
      },
    };

    const got = parseObjectInputFields(
      objectType,
      [fields] as unknown as IntrospectionField[],
      {},
    );
    expect(got).toEqual([
      {
        enumValues: undefined,
        isList: false,
        isRequired: true,
        name: "Test",
        type: "string",
        originalType: "String",
      },
    ]);
  });

  test("marks the field as a list when the kind is LIST", () => {
    const fields = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "LIST",
        name: "String",
      },
    };

    const got = parseObjectInputFields(
      objectType,
      [fields] as unknown as IntrospectionField[],
      {},
    );
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
    const fields = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "ENUM",
        name: "MyCustomEnum",
      },
    };

    const got = parseObjectInputFields(
      objectType,
      [fields] as unknown as IntrospectionField[],
      {
        MyCustomEnum: {
          name: "MyCustomEnum",
          kind: "ENUM",
          enumValues: [
            { name: "ENUM1" },
            { name: "ENUM2" },
          ] as IntrospectionEnumValue[],
        },
      },
    );
    expect(got).toEqual([
      {
        enumValues: ["ENUM1", "ENUM2"],
        isList: false,
        isRequired: false,
        name: "Test",
        type: "enum",
        originalType: "MyCustomEnum",
      },
    ]);
  });

  test("parses a required enum input", () => {
    const fields = {
      name: "Test",
      type: {
        ...defaultType,
        kind: "NON_NULL",
        name: null,
        ofType: {
          ...defaultType,
          kind: "ENUM",
          name: "MyCustomEnum",
        },
      },
    };

    const got = parseObjectInputFields(
      objectType,
      [fields] as unknown as IntrospectionField[],
      {
        MyCustomEnum: {
          name: "MyCustomEnum",
          kind: "ENUM",
          enumValues: [
            { name: "ENUM1" },
            { name: "ENUM2" },
          ] as IntrospectionEnumValue[],
        },
      },
    );
    expect(got).toEqual([
      {
        enumValues: ["ENUM1", "ENUM2"],
        isList: false,
        isRequired: true,
        name: "Test",
        type: "enum",
        originalType: "MyCustomEnum",
      },
    ]);
  });

  test("ignores an INPUT_OBJECT and OBJECT", () => {
    const fields = [
      {
        name: "availability",
        type: {
          kind: "INPUT_OBJECT",
          name: "AvailabilityInput",
          enumValues: null,
          fields: [],
          inputFields: [],
          ofType: null,
        },
      },
      {
        name: "relationships",
        type: {
          kind: "OBJECT",
          name: "Relationships",
          enumValues: null,
          fields: [],
          inputFields: [],
          ofType: null,
        },
      },
    ];

    const got = parseObjectInputFields(
      objectType,
      fields as unknown as IntrospectionField[],
      {},
    );
    expect(got).toEqual([]);
  });
});

describe("parseObjectRelationships", () => {
  test("returns the names of the relationships", () => {
    const inputFields = [
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
    ];

    const got = parseObjectRelationships(
      inputFields as unknown as IntrospectionInputValue[],
    );
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
            field_config: [
              { name: "title", ui_position: 1, ui_field_type: "STRING" },
            ],
          },
          _meta: {
            language_data: {
              language: "en-GB",
              version: 2,
            },
            available_languages: ["en-GB", "pt-PT"],
            global_data: {
              version: 1,
            },
          },
        } as SkylarkGraphQLObject,
      },
      {
        position: 2,
        object: {
          __typename: "SkylarkSet",
          uid: "set_1",
          _config: {
            colour: "black",
            primary_field: "uid",
            display_name: "Set",
            field_config: [
              { name: "synopsis", ui_position: 2, ui_field_type: "TEXTAREA" },
            ],
          },
          _meta: {
            language_data: {
              language: "en-GB",
              version: 1,
            },
            available_languages: ["en-GB"],
            global_data: {
              version: 2,
            },
          },
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
            objectTypeDisplayName: undefined,
            fieldConfig: [
              {
                name: "title",
                position: 1,
                fieldType: "STRING",
              },
            ],
          },
          meta: {
            availableLanguages: ["en-GB", "pt-PT"],
            language: "en-GB",
            versions: {
              global: 1,
              language: 2,
            },
            availabilityStatus: null,
          },
          object: objects[0].object,
          objectType: objects[0].object.__typename,
          position: 1,
        },
        {
          config: {
            colour: "black",
            primaryField: "uid",
            objectTypeDisplayName: "Set",
            fieldConfig: [
              {
                name: "synopsis",
                position: 2,
                fieldType: "TEXTAREA",
              },
            ],
          },
          meta: {
            availableLanguages: ["en-GB"],
            language: "en-GB",
            versions: {
              global: 2,
              language: 1,
            },
            availabilityStatus: null,
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
  test("should parse skylark object", () => {
    const skylarkObject: SkylarkGraphQLObject = {
      __typename: "Season",
      _config: {
        primary_field: "title",
        colour: "#9c27b0",
        display_name: "SpecialSeason",
        field_config: [
          {
            name: "title",
            ui_position: 1,
            ui_field_type: "STRING",
          },
        ],
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
        __typename: "SkylarkAvailabilityListing",
        next_token: null,
        objects: [],
      },
      images: {
        __typename: "SkylarkImageListing",
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
        objectTypeDisplayName: "SpecialSeason",
        fieldConfig: [
          {
            name: "title",
            position: 1,
            fieldType: "STRING",
          },
        ],
      },
      meta: {
        language: "pt-PT",
        availableLanguages: ["en-GB", "pt-PT"],
        versions: {
          language: 1,
          global: 2,
        },
        availabilityStatus: AvailabilityStatus.Unavailable,
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

  test("should parse Availability object", () => {
    const skylarkObject: SkylarkGraphQLObject = {
      __typename: BuiltInSkylarkObjectType.Availability,
      _config: {
        primary_field: "title",
        colour: "#9c27b0",
        display_name: "",
        field_config: [
          {
            name: "title",
            ui_position: 1,
            ui_field_type: "STRING",
          },
          {
            name: SkylarkAvailabilityField.Start,
            ui_position: 2,
            ui_field_type: "STRING",
          },
        ],
      },
      uid: "avail_123",
      external_id: "",
      slug: "avail-123",
      title: "Always Avail",
      [SkylarkAvailabilityField.Start]: "",
      [SkylarkAvailabilityField.End]: "",
      [SkylarkAvailabilityField.Timezone]: "",
    };

    const expectedParsedObject: ParsedSkylarkObject = {
      objectType: BuiltInSkylarkObjectType.Availability,
      uid: "avail_123",
      config: {
        colour: "#9c27b0",
        primaryField: "title",
        objectTypeDisplayName: "",
        fieldConfig: [
          {
            name: "title",
            position: 1,
            fieldType: "STRING",
          },
          {
            name: SkylarkAvailabilityField.Start,
            position: 2,
            fieldType: "STRING",
          },
          // TIMEZONE is auto added
          {
            name: SkylarkAvailabilityField.Timezone,
            position: 50,
            fieldType: "TIMEZONE",
          },
        ],
      },
      meta: expect.any(Object),
      metadata: expect.any(Object),
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
      want: "",
    },
    {
      input: "",
      type: "date",
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
      want: "12:30:31.000+00:00",
    },
    {
      input: "12:30",
      type: "time",
      want: "12:30:00.000+00:00",
    },
    {
      input: "12:30:31+00:00",
      type: "time",
      want: "12:30:31.000+00:00",
    },
    {
      input: "12:30+00:00",
      type: "time",
      want: "12:30:00.000+00:00",
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
    {
      input: false,
      type: "boolean",
      want: false,
    },
    {
      input: undefined as unknown as string | number | boolean | string[],
      type: "boolean",
      want: null,
    },
  ];

  tests.forEach(({ input, type, want }) => {
    test(`returns ${want} when input is ${input} and type is ${type}`, () => {
      const got = parseInputFieldValue(input, type);
      expect(got).toEqual(want);
    });
  });
});

describe("parseMetadataForGraphQLRequest", () => {
  const objectType = "Episode";

  const inputFields: NormalizedObjectField[] = [
    {
      name: "title",
      type: "string",
      originalType: "String",
      isList: false,
      isRequired: false,
    },
    {
      name: SkylarkSystemField.ExternalID,
      type: "string",
      originalType: "String",
      isList: false,
      isRequired: false,
    },
    {
      name: "date",
      type: "date",
      originalType: "AWSDate",
      isList: false,
      isRequired: false,
    },
    {
      name: "int",
      type: "int",
      originalType: "Int",
      isList: false,
      isRequired: false,
    },
  ];

  test("returns nulled object values when either null or empty string is given unless field is UID", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      title: "",
      date: "",
      int: null,
      [SkylarkSystemField.UID]: "",
      [SkylarkSystemField.ExternalID]: "",
    };
    const got = parseMetadataForGraphQLRequest(
      objectType,
      metadata,
      inputFields,
    );
    expect(got).toEqual({
      title: "",
      date: null,
      int: null,
    });
  });

  test("returns metadata with formatted values", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      title: "string",
      date: "2020-11-03",
      int: 2.5,
    };
    const got = parseMetadataForGraphQLRequest(
      objectType,
      metadata,
      inputFields,
    );
    expect(got).toEqual({
      title: "string",
      date: "2020-11-03+00:00",
      int: 2,
    });
  });

  test("removes any values from metadata if they are not a valid inputField", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      title: "string",
      date: "2020-11-03",
      int: 2.5,
      invalid: true,
    };
    const got = parseMetadataForGraphQLRequest(
      objectType,
      metadata,
      inputFields,
    );
    expect(got).toEqual({
      title: "string",
      date: "2020-11-03+00:00",
      int: 2,
    });
  });

  test("removes timezone field from Availability object", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      title: "string",
      timezone: "Europe/London",
    };
    const got = parseMetadataForGraphQLRequest(
      BuiltInSkylarkObjectType.Availability,
      metadata,
      inputFields,
    );
    expect(got).toEqual({
      title: "string",
    });
  });

  describe("Availability object type", () => {
    const availabilityInputFields: NormalizedObjectField[] = [
      {
        name: "title",
        type: "string",
        originalType: "String",
        isList: false,
        isRequired: false,
      },
      {
        name: SkylarkSystemField.ExternalID,
        type: "string",
        originalType: "String",
        isList: false,
        isRequired: false,
      },
      {
        name: SkylarkAvailabilityField.Start,
        type: "datetime",
        originalType: "AWSDateTime",
        isList: false,
        isRequired: false,
      },
      {
        name: SkylarkAvailabilityField.End,
        type: "datetime",
        originalType: "AWSDateTime",
        isList: false,
        isRequired: false,
      },
    ];

    test("removes timezone field from request", () => {
      const metadata: Record<string, SkylarkObjectMetadataField> = {
        title: "string",
        [SkylarkAvailabilityField.Timezone]: "+01:00",
      };
      const got = parseMetadataForGraphQLRequest(
        BuiltInSkylarkObjectType.Availability,
        metadata,
        availabilityInputFields,
      );
      expect(got).toEqual({ title: "string" });
    });

    test("sends the largest and smallest AWS date values for the start and end fields when no value is given", () => {
      const metadata: Record<string, SkylarkObjectMetadataField> = {
        title: "string",
        [SkylarkAvailabilityField.Timezone]: "+01:00",
        [SkylarkAvailabilityField.Start]: "",
        [SkylarkAvailabilityField.End]: "",
      };
      const got = parseMetadataForGraphQLRequest(
        BuiltInSkylarkObjectType.Availability,
        metadata,
        availabilityInputFields,
      );
      expect(got).toEqual({
        title: "string",
        start: AWS_EARLIEST_DATE,
        end: AWS_LATEST_DATE,
      });
    });

    test("appends the timezone onto start and end fields", () => {
      const metadata: Record<string, SkylarkObjectMetadataField> = {
        title: "string",
        [SkylarkAvailabilityField.Timezone]: "+01:00",
        [SkylarkAvailabilityField.Start]: "2022-10-30T12:30:00",
        [SkylarkAvailabilityField.End]: "2022-05-20T12:30:00Z",
      };
      const got = parseMetadataForGraphQLRequest(
        BuiltInSkylarkObjectType.Availability,
        metadata,
        availabilityInputFields,
      );
      expect(got).toEqual({
        title: "string",
        [SkylarkAvailabilityField.Start]: "2022-10-30T12:30:00.000+01:00",
        [SkylarkAvailabilityField.End]: "2022-05-20T12:30:00.000+01:00",
      });
    });
  });
});

describe("parseMetadataForHTMLForm", () => {
  const inputFields: NormalizedObjectField[] = [
    {
      name: "title",
      type: "string",
      originalType: "String",
      isList: false,
      isRequired: false,
    },
    {
      name: "date",
      type: "date",
      originalType: "AWSDate",
      isList: false,
      isRequired: false,
    },
    {
      name: "datetime",
      type: "datetime",
      originalType: "AWSDateTime",
      isList: false,
      isRequired: false,
    },
    {
      name: "time",
      type: "time",
      originalType: "AWSTime",
      isList: false,
      isRequired: false,
    },
  ];

  test("returns a string without any formatting", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      title: "string",
      any: "string",
    };
    const got = parseMetadataForHTMLForm(metadata, inputFields);
    expect(got).toEqual({
      title: "string",
      any: "string",
    });
  });

  test("reformats a date input", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      date: "2020-11-20+00:00",
    };
    const got = parseMetadataForHTMLForm(metadata, inputFields);
    expect(got).toEqual({
      date: "2020-11-20",
    });
  });

  test("reformats a time input", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      time: "16:30:00.000+00:00",
    };
    const got = parseMetadataForHTMLForm(metadata, inputFields);
    expect(got).toEqual({
      time: "16:30:00.000",
    });
  });

  test("reformats a datetime input", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      datetime: "2020-11-20T16:30:00.000+00:00",
    };
    const got = parseMetadataForHTMLForm(metadata, inputFields);
    expect(got).toEqual({
      datetime: "2020-11-20T16:30:00.000",
    });
  });

  test("reformats a null to an empty string", () => {
    const metadata: Record<string, SkylarkObjectMetadataField> = {
      title: null,
    };
    const got = parseMetadataForHTMLForm(metadata, inputFields);
    expect(got).toEqual({
      title: "",
    });
  });
});

describe("parseUpdatedRelationshipObjects", () => {
  const relationship: SkylarkObjectRelationship = {
    relationshipName: "Seasons",
    objectType: "season",
  };

  const expectedParsedObject: ParsedSkylarkObject = {
    objectType: "Season",
    uid: "uid123",
    config: {
      colour: "#9c27b0",
      primaryField: "title",
      fieldConfig: [],
    },
    meta: {
      language: "pt-PT",
      availableLanguages: ["en-GB", "pt-PT"],
      versions: {
        language: 1,
        global: 2,
      },
      availabilityStatus: AvailabilityStatus.Unavailable,
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

  const updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] = [
    {
      ...relationship,
      objects: [expectedParsedObject],
    },
  ];
  const originalRelationshipObjects: ParsedSkylarkObjectRelationships[] = [
    {
      ...relationship,
      objects: [expectedParsedObject],
    },
  ];

  test("returns the correct linked and unlinked uids", () => {
    const result = parseUpdatedRelationshipObjects(
      relationship,
      updatedRelationshipObjects,
      originalRelationshipObjects,
    );
    expect(result).toEqual({
      relationship: relationship,
      uidsToLink: [],
      uidsToUnlink: [],
    });
  });

  test("returns the correct linked and unlinked uids when original objects is empty", () => {
    const result = parseUpdatedRelationshipObjects(
      relationship,
      updatedRelationshipObjects,
      [],
    );
    expect(result).toEqual({
      relationship: relationship,
      uidsToLink: ["uid123"],
      uidsToUnlink: [],
    });
  });

  test("returns the correct linked and unlinked uids when updated objects is empty", () => {
    const result = parseUpdatedRelationshipObjects(
      relationship,
      [],
      originalRelationshipObjects,
    );
    expect(result).toEqual({
      relationship: relationship,
      uidsToLink: [],
      uidsToUnlink: ["uid123"],
    });
  });

  test("returns the correct linked and unlinked uids when both original and updated objects are empty", () => {
    const result = parseUpdatedRelationshipObjects(relationship, [], []);
    expect(result).toEqual({
      relationship: relationship,
      uidsToLink: [],
      uidsToUnlink: [],
    });
  });

  test("returns the correct linked and unlinked uids when relationshipName is not found", () => {
    const result = parseUpdatedRelationshipObjects(
      { relationshipName: "invalid-relationship", objectType: "season" },
      updatedRelationshipObjects,
      originalRelationshipObjects,
    );
    expect(result).toEqual({
      relationship: {
        relationshipName: "invalid-relationship",
        objectType: "season",
      },
      uidsToLink: [],
      uidsToUnlink: [],
    });
  });
});
