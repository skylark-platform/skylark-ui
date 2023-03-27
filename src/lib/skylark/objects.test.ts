import GQLSkylarkSchemaQueryFixtureJSON from "src/__tests__/fixtures/skylark/queries/introspection/schema.json";
import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";

import { getAllObjectsMeta, getObjectOperations } from "./objects";

const GQLSkylarkSchemaQueryFixture =
  GQLSkylarkSchemaQueryFixtureJSON as unknown as {
    data: GQLSkylarkSchemaQueriesMutations;
  };

describe("getObjectOperations", () => {
  test("returns all operations for Asset", () => {
    const got = getObjectOperations(
      "Asset",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.name).toEqual("Asset");

    // Check fields
    expect(got.fields.length).toBe(6);
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: true,
      name: "uid",
      type: "string",
    });
    expect(got.fields).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "title",
      type: "string",
    });

    // Check operations
    expect(got.operations.get).toBeTruthy();
    expect(got.operations.get?.name).toEqual("getAsset");
    expect(got.operations.list).toBeTruthy();
    expect(got.operations.list?.name).toEqual("listAsset");
    expect(got.operations.create).toBeTruthy();
    expect(got.operations.create?.name).toEqual("createAsset");
    expect(got.operations.update).toBeTruthy();
    expect(got.operations.update?.name).toEqual("updateAsset");
    expect(got.operations.delete).toBeTruthy();
    expect(got.operations.delete?.name).toEqual("deleteAsset");

    expect(got.operations.create.inputs).toContainEqual({
      enumValues: undefined,
      isList: false,
      isRequired: false,
      name: "title",
      type: "string",
    });
  });

  test("returns availability for an Asset", () => {
    const got = getObjectOperations(
      "Asset",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.availability).toBeTruthy();
    expect(got.availability?.name).toEqual("Availability");
    expect(got.availability?.fields.length).toEqual(7);
  });

  test("returns images for an Asset", () => {
    const got = getObjectOperations(
      "Asset",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got.images).toBeTruthy();
    expect(got.images?.relationshipNames).toEqual(["images"]);
    expect(got.images?.objectMeta.name).toEqual("Image");
    expect(got.images?.objectMeta.fields.length).toEqual(12);
  });

  test("throws when an operation doesn't exist for an object type", () => {
    expect(() =>
      getObjectOperations(
        "NonExistantObject",
        GQLSkylarkSchemaQueryFixture.data.__schema,
      ),
    ).toThrow(
      'Skylark ObjectType "NonExistantObject" is missing expected operations "getQuery, listQuery, createMutation, updateMutation, deleteMutation"',
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
    expect(got[0].fields.length).toEqual(12);
  });
});
