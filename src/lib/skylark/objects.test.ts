import { IntrospectionSchema } from "graphql";

import GQLSkylarkSchemaQueryFixtureJSON from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";

import { getAllObjectsMeta, getObjectOperations } from "./objects";

const GQLSkylarkSchemaQueryFixture =
  GQLSkylarkSchemaQueryFixtureJSON as unknown as {
    data: {
      __schema: IntrospectionSchema;
    };
  };

describe("getObjectOperations", () => {
  test("returns all object meta for SkylarkAsset", () => {
    const got = getObjectOperations(
      "SkylarkAsset",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.name).toEqual("SkylarkAsset");

    // Check fields
    expect(got.fields.length).toBe(9);
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: true,
      name: "uid",
      type: "string",
      originalType: "String",
    });
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "title",
      type: "string",
      originalType: "String",
    });
    expect(got.fieldConfig).toEqual({
      global: ["type", "url", "ingest_file"],
      translatable: ["title", "slug", "duration", "release_date"],
    });
    expect(got.isTranslatable).toBeTruthy();

    // Check relationships
    expect(got.hasAvailability).toBeTruthy();
    expect(got.hasContent).toBeFalsy();
    expect(got.hasRelationships).toBeTruthy();
    expect(got.relationships).toEqual([
      {
        objectType: "Brand",
        relationshipName: "brands",
      },
      {
        objectType: "Episode",
        relationshipName: "episodes",
      },
      {
        objectType: "Movie",
        relationshipName: "movies",
      },
      {
        objectType: "Rating",
        relationshipName: "ratings",
      },
      {
        objectType: "Season",
        relationshipName: "seasons",
      },
      {
        objectType: "SkylarkAudioTrack",
        relationshipName: "audio_tracks",
      },
      {
        objectType: "SkylarkDRMProvider",
        relationshipName: "drm_providers",
      },
      {
        objectType: "SkylarkImage",
        relationshipName: "images",
      },
      {
        objectType: "SkylarkPlaybackDetail",
        relationshipName: "playback_details",
      },
      {
        objectType: "SkylarkPlaybackProvider",
        relationshipName: "playback_providers",
      },
      {
        objectType: "SkylarkSet",
        relationshipName: "sets",
      },
      {
        objectType: "SkylarkTag",
        relationshipName: "tags",
      },
      {
        objectType: "SkylarkTextTrack",
        relationshipName: "text_tracks",
      },
      {
        objectType: "SkylarkVideoTrack",
        relationshipName: "video_tracks",
      },
    ]);
    expect(got.images?.relationshipNames).toEqual(["images"]);

    // Check operations
    expect(got.operations.get).toBeTruthy();
    expect(got.operations.get?.name).toEqual("getSkylarkAsset");
    expect(got.operations.list).toBeTruthy();
    expect(got.operations.list?.name).toEqual("listSkylarkAsset");
    expect(got.operations.create).toBeTruthy();
    expect(got.operations.create?.name).toEqual("createSkylarkAsset");
    expect(got.operations.update).toBeTruthy();
    expect(got.operations.update?.name).toEqual("updateSkylarkAsset");
    expect(got.operations.delete).toBeTruthy();
    expect(got.operations.delete?.name).toEqual("deleteSkylarkAsset");

    expect(got.operations.create.inputs).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "title",
      type: "string",
      originalType: "String",
    });
  });

  test("returns all object meta for SkylarkSet", () => {
    const got = getObjectOperations(
      "SkylarkSet",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.name).toEqual("SkylarkSet");

    // Check fields
    expect(got.fields.length).toBe(11);
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: true,
      name: "uid",
      type: "string",
      originalType: "String",
    });
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "title",
      type: "string",
      originalType: "String",
    });
    expect(got.fieldConfig).toEqual({
      global: ["type"],
      translatable: [
        "slug",
        "title",
        "title_short",
        "title_sort",
        "synopsis",
        "synopsis_short",
        "release_date",
        "description",
      ],
    });
    expect(got.isTranslatable).toBeTruthy();

    // Check relationships
    expect(got.hasAvailability).toBeTruthy();
    expect(got.hasContent).toBeTruthy();
    expect(got.hasRelationships).toBeTruthy();
    expect(got.relationships).toEqual([
      {
        objectType: "Credit",
        relationshipName: "credits",
      },
      {
        objectType: "Genre",
        relationshipName: "genres",
      },
      {
        objectType: "Rating",
        relationshipName: "ratings",
      },
      {
        objectType: "SkylarkAsset",
        relationshipName: "assets",
      },
      {
        objectType: "SkylarkImage",
        relationshipName: "images",
      },
      {
        objectType: "SkylarkTag",
        relationshipName: "tags",
      },
      {
        objectType: "Theme",
        relationshipName: "themes",
      },
    ]);
    expect(got.images?.relationshipNames).toEqual(["images"]);

    // Check operations
    expect(got.operations.get).toBeTruthy();
    expect(got.operations.get?.name).toEqual("getSkylarkSet");
    expect(got.operations.list).toBeTruthy();
    expect(got.operations.list?.name).toEqual("listSkylarkSet");
    expect(got.operations.create).toBeTruthy();
    expect(got.operations.create?.name).toEqual("createSkylarkSet");
    expect(got.operations.update).toBeTruthy();
    expect(got.operations.update?.name).toEqual("updateSkylarkSet");
    expect(got.operations.delete).toBeTruthy();
    expect(got.operations.delete?.name).toEqual("deleteSkylarkSet");

    expect(got.operations.create.inputs).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "title",
      type: "string",
      originalType: "String",
    });
  });

  test("returns all object meta for Availability", () => {
    const got = getObjectOperations(
      "Availability",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.name).toEqual("Availability");

    // Check fields
    expect(got.fields.length).toBe(7);
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: true,
      name: "uid",
      type: "string",
      originalType: "String",
    });
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "start",
      type: "datetime",
      originalType: "AWSDateTime",
    });
    expect(got.fieldConfig).toEqual({
      global: [
        "uid",
        "external_id",
        "title",
        "slug",
        "start",
        "end",
        "timezone",
      ],
      translatable: [],
    });
    expect(got.isTranslatable).toBeFalsy();

    // Check relationships
    expect(got.hasAvailability).toBeFalsy();
    expect(got.hasContent).toBeFalsy();
    expect(got.hasRelationships).toBeFalsy();
    expect(got.relationships).toEqual([]);
    expect(got.images?.relationshipNames).toBeUndefined();

    // Check operations
    expect(got.operations.get).toBeTruthy();
    expect(got.operations.get?.name).toEqual("getAvailability");
    expect(got.operations.list).toBeTruthy();
    expect(got.operations.list?.name).toEqual("listAvailability");
    expect(got.operations.create).toBeTruthy();
    expect(got.operations.create?.name).toEqual("createAvailability");
    expect(got.operations.update).toBeTruthy();
    expect(got.operations.update?.name).toEqual("updateAvailability");
    expect(got.operations.delete).toBeTruthy();
    expect(got.operations.delete?.name).toEqual("deleteAvailability");

    expect(got.operations.create.inputs).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "title",
      type: "string",
      originalType: "String",
    });
  });

  test("returns availability for an SkylarkAsset", () => {
    const got = getObjectOperations(
      "SkylarkAsset",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.availability).toBeTruthy();
    expect(got.availability?.name).toEqual("Availability");
    expect(got.availability?.fields.length).toEqual(7);
  });

  test("returns images for an SkylarkAsset", () => {
    const got = getObjectOperations(
      "SkylarkAsset",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.images).toBeTruthy();
    expect(got.images?.relationshipNames).toEqual(["images"]);
    expect(got.images?.objectMeta.name).toEqual("SkylarkImage");
    expect(got.images?.objectMeta.fields.length).toEqual(12);
  });

  test("throws when an object type doesn't exist", () => {
    expect(() =>
      getObjectOperations(
        "NonExistantObject",
        GQLSkylarkSchemaQueryFixture.data.__schema,
      ),
    ).toThrow('Schema: Object "NonExistantObject" not found');
  });

  test("throws when an operation doesn't exist for an object type", () => {
    expect(() =>
      getObjectOperations(
        "ObjectConfig",
        GQLSkylarkSchemaQueryFixture.data.__schema,
      ),
    ).toThrow(
      'Skylark ObjectType "ObjectConfig" is missing expected operations "getQuery, listQuery, createMutation, updateMutation, deleteMutation"',
    );
  });
});

describe("getAllObjectsMeta", () => {
  test("returns Episode", () => {
    const got = getAllObjectsMeta(GQLSkylarkSchemaQueryFixture.data.__schema, [
      "Episode",
    ]);
    expect(got.length).toEqual(1);
    expect(got[0].name).toEqual("Episode");
    expect(got[0].fields.length).toEqual(10);
  });
});
