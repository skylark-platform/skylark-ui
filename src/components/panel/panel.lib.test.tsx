import {
  AddedSkylarkObjectContentObject,
  AvailabilityStatus,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";

import {
  HandleDropErrorType,
  handleDroppedAvailabilities,
  handleDroppedContents,
  handleDroppedRelationships,
} from "./panel.lib";

const objectMetaRelationships: SkylarkObjectMeta["relationships"] = [
  {
    relationshipName: "seasons",
    objectType: "Season",
  },
];

const panelObject: ParsedSkylarkObject = {
  uid: "PANEL_OBJECT",
  objectType: "Season",
  metadata: {
    uid: "PANEL_OBJECT",
    external_id: "",
    title: "the season",
  },
  config: {
    primaryField: "title",
    fieldConfig: [],
  },
  meta: {
    language: "",
    availableLanguages: [],
    availabilityStatus: AvailabilityStatus.Unavailable,
  },
  availability: {
    status: AvailabilityStatus.Unavailable,
    objects: [],
  },
};

const droppedObjects: ParsedSkylarkObject[] = [
  panelObject,
  {
    ...panelObject,
    uid: "new-season",
    metadata: { ...panelObject.metadata, uid: "new-season" },
  },
  {
    ...panelObject,
    uid: "new-brand",
    metadata: { ...panelObject.metadata, uid: "new-brand" },
    objectType: "Brand",
  },
  {
    ...panelObject,
    uid: "new-availability",
    metadata: { ...panelObject.metadata, uid: "new-availability" },
    objectType: BuiltInSkylarkObjectType.Availability,
  },
];

describe("handleDroppedRelationships", () => {
  test("receives the expected relationships and errors", () => {
    const existingRelationships: ParsedSkylarkObjectRelationships[] = [
      {
        relationshipName: "seasons",
        objectType: "Season",
        objects: [
          { ...panelObject, uid: "EXISTING_REL" },
          { ...panelObject, uid: "rel-2" },
        ],
      },
    ];

    const got = handleDroppedRelationships({
      activeObjectUid: panelObject.uid,
      existingObjects: existingRelationships,
      droppedObjects: [
        ...droppedObjects,
        {
          ...panelObject,
          uid: "EXISTING_REL",
          metadata: { ...panelObject.metadata, uid: "EXISTING_REL" },
        },
      ],
      objectMetaRelationships,
    });

    // Check valid relationships
    expect(got.updatedRelationshipObjects).toHaveLength(1);
    expect(got.updatedRelationshipObjects[0]).toEqual({
      relationshipName: "seasons",
      objectType: "Season",
      objects: expect.any(Object),
    });
    expect(got.updatedRelationshipObjects[0].objects).toHaveLength(3);
    expect(got.updatedRelationshipObjects[0].objects[0]).toHaveProperty(
      "uid",
      "new-season",
    );
    expect(got.updatedRelationshipObjects[0].objects[1]).toHaveProperty(
      "uid",
      existingRelationships[0].objects[0].uid,
    );
    expect(got.updatedRelationshipObjects[0].objects[2]).toHaveProperty(
      "uid",
      existingRelationships[0].objects[1].uid,
    );

    // Check errors
    expect(got.errors).toHaveLength(4);
    expect(got.errors).toEqual([
      {
        object: expect.any(Object),
        type: HandleDropErrorType.OBJECTS_ARE_SAME,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.INVALID_OBJECT_TYPE,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.INVALID_OBJECT_TYPE,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.EXISTING_LINK,
      },
    ]);
    expect(got.errors[0].object.metadata).toHaveProperty("uid", "PANEL_OBJECT");
    expect(got.errors[1].object.metadata).toHaveProperty("uid", "new-brand");
    expect(got.errors[2].object.metadata).toHaveProperty(
      "uid",
      "new-availability",
    );
    expect(got.errors[3].object.metadata).toHaveProperty("uid", "EXISTING_REL");
  });
});

describe("handleDroppedContents", () => {
  test("receives the expected content objects and errors", () => {
    const existingOb = {
      objectType: panelObject.objectType,
      config: panelObject.config,
      meta: panelObject.meta,
      object: {
        ...panelObject.metadata,
        uid: "EXISTING_OBJECT",
      },
      position: 0,
    };

    const existingObjectContent: AddedSkylarkObjectContentObject[] = [
      existingOb,
    ];

    const got = handleDroppedContents({
      panelObject,
      existingObjects: existingObjectContent,
      droppedObjects: [
        ...droppedObjects,
        {
          ...panelObject,
          uid: existingOb.object.uid,
          metadata: existingOb.object,
        },
      ],
    });

    // Check valid content objects
    expect(got.updatedContentObjects).toHaveLength(3);
    expect(got.updatedContentObjects[0]).toEqual(existingOb);
    expect(got.updatedContentObjects[1].object).toHaveProperty(
      "uid",
      droppedObjects[1].uid,
    );
    expect(got.updatedContentObjects[1].isNewObject).toBeTruthy();
    expect(got.updatedContentObjects[2].object).toHaveProperty(
      "uid",
      droppedObjects[2].uid,
    );
    expect(got.updatedContentObjects[2].isNewObject).toBeTruthy();

    // Check errors
    expect(got.errors).toHaveLength(3);
    expect(got.errors).toEqual([
      {
        object: expect.any(Object),
        type: HandleDropErrorType.OBJECTS_ARE_SAME,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.INVALID_OBJECT_TYPE,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.EXISTING_LINK,
      },
    ]);
    expect(got.errors[0].object.metadata).toHaveProperty("uid", "PANEL_OBJECT");
    expect(got.errors[1].object.metadata).toHaveProperty(
      "uid",
      "new-availability",
    );
    expect(got.errors[2].object.metadata).toHaveProperty(
      "uid",
      "EXISTING_OBJECT",
    );
  });
});

describe("handleDroppedAvailabilities", () => {
  test("receives the expected availability objects and errors", () => {
    const existingOb: ParsedSkylarkObject = {
      ...panelObject,
      objectType: BuiltInSkylarkObjectType.Availability,
      metadata: {
        ...panelObject.metadata,
        uid: "EXISTING_OBJECT",
      },
      uid: "EXISTING_OBJECT",
    };

    const got = handleDroppedAvailabilities({
      panelObject,
      existingObjects: [existingOb],
      droppedObjects: [...droppedObjects, existingOb],
    });

    // Check valid content objects
    expect(got.updatedAvailabilityObjects).toHaveLength(2);
    expect(got.updatedAvailabilityObjects[0]).toEqual(existingOb);
    expect(got.updatedAvailabilityObjects[1]).toHaveProperty(
      "uid",
      "new-availability",
    );

    // Check errors
    expect(got.errors).toHaveLength(4);
    expect(got.errors).toEqual([
      {
        object: expect.any(Object),
        type: HandleDropErrorType.INVALID_OBJECT_TYPE,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.INVALID_OBJECT_TYPE,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.INVALID_OBJECT_TYPE,
      },
      {
        object: expect.any(Object),
        type: HandleDropErrorType.EXISTING_LINK,
      },
    ]);
    expect(got.errors[0].object.metadata).toHaveProperty("uid", "PANEL_OBJECT");
    expect(got.errors[1].object.metadata).toHaveProperty("uid", "new-season");
    expect(got.errors[2].object.metadata).toHaveProperty("uid", "new-brand");
    expect(got.errors[3].object.metadata).toHaveProperty(
      "uid",
      "EXISTING_OBJECT",
    );
  });
});
