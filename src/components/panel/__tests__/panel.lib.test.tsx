import {
  HandleDropErrorType,
  handleDroppedAvailabilities,
  handleDroppedContents,
  handleDroppedRelationships,
} from "src/components/panel/panel.lib";
import {
  AddedSkylarkObjectContentObject,
  AvailabilityStatus,
  BuiltInSkylarkObjectType,
  SkylarkObjectRelationships,
  SkylarkObjectMeta,
  SkylarkObject,
} from "src/interfaces/skylark";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";

const objectMetaRelationships: SkylarkObjectMeta["relationships"] = [
  {
    relationshipName: "seasons",
    objectType: "Season",
    reverseRelationshipName: "reverse_relationships",
  },
];

const panelObject: SkylarkObject = convertParsedObjectToIdentifier({
  uid: "PANEL_OBJECT",
  objectType: "Season",
  metadata: {
    uid: "PANEL_OBJECT",
    external_id: "",
    title: "the season",
    type: null,
  },
  config: {
    primaryField: "title",
    fieldConfig: [],
  },
  meta: {
    language: "",
    availableLanguages: [],
    availabilityStatus: AvailabilityStatus.Unavailable,
    versions: {},
  },
  availability: {
    status: AvailabilityStatus.Unavailable,
    objects: [],
    dimensions: [],
  },
});

const droppedObjects: SkylarkObject[] = [
  panelObject,
  {
    ...panelObject,
    uid: "new-season",
  },
  {
    ...panelObject,
    uid: "new-brand",
    objectType: "Brand",
    contextualFields: null,
  },
  {
    ...panelObject,
    uid: "new-availability",
    objectType: BuiltInSkylarkObjectType.Availability,
    contextualFields: null,
  },
];

describe("handleDroppedRelationships", () => {
  test("receives the expected relationships and errors", () => {
    const existingRelationships: SkylarkObjectRelationships = {
      seasons: {
        name: "seasons",
        objectType: "Season",
        objects: [
          { ...panelObject, uid: "EXISTING_REL" },
          { ...panelObject, uid: "rel-2" },
        ],
        config: {
          defaultSortField: "uid",
          inheritAvailability: false,
        },
      },
    };

    const got = handleDroppedRelationships({
      activeObjectUid: panelObject.uid,
      existingObjects: existingRelationships,
      droppedObjects: [
        ...droppedObjects,
        {
          ...panelObject,
          uid: "EXISTING_REL",
        },
      ],
      objectMetaRelationships,
    });

    // Check valid relationships
    expect(Object.keys(got.updatedRelationshipObjects)).toHaveLength(1);
    expect(Object.keys(got.updatedRelationshipObjects)[0]).toBe("seasons");

    const gotSeasons = got.updatedRelationshipObjects.seasons;

    expect(gotSeasons).toEqual({
      name: "seasons",
      objectType: "Season",
      objects: expect.any(Object),
      config: {
        defaultSortField: "uid",
        inheritAvailability: false,
      },
    });
    expect(gotSeasons.objects).toHaveLength(3);
    expect(gotSeasons.objects[0]).toHaveProperty("uid", "new-season");
    expect(gotSeasons.objects[1]).toHaveProperty(
      "uid",
      existingRelationships.seasons.objects[0].uid,
    );
    expect(gotSeasons.objects[2]).toHaveProperty(
      "uid",
      existingRelationships.seasons.objects[1].uid,
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
    expect(got.errors[0].object).toHaveProperty("uid", "PANEL_OBJECT");
    expect(got.errors[1].object).toHaveProperty("uid", "new-brand");
    expect(got.errors[2].object).toHaveProperty("uid", "new-availability");
    expect(got.errors[3].object).toHaveProperty("uid", "EXISTING_REL");
  });

  test("receives the expected relationships and errors when targetRelationship is given", () => {
    const existingRelationships: SkylarkObjectRelationships = {
      seasons: {
        name: "seasons",
        objectType: "Season",
        objects: [],
        config: {
          defaultSortField: null,
          inheritAvailability: null,
        },
      },
    };

    const got = handleDroppedRelationships({
      activeObjectUid: panelObject.uid,
      existingObjects: existingRelationships,
      droppedObjects: [
        {
          ...panelObject,
          uid: "new-season",
        },
        {
          ...panelObject,
          objectType: "Episode",
          uid: "invalid-episode",
          contextualFields: null,
        },
      ],
      objectMetaRelationships,
      targetRelationship: "seasons",
    });

    // Check valid relationships
    expect(Object.keys(got.updatedRelationshipObjects)).toHaveLength(1);
    expect(Object.keys(got.updatedRelationshipObjects)[0]).toBe("seasons");

    const gotSeasons = got.updatedRelationshipObjects.seasons;

    expect(gotSeasons).toEqual({
      name: "seasons",
      objectType: "Season",
      objects: expect.any(Object),
      config: {
        defaultSortField: null,
        inheritAvailability: null,
      },
    });
    expect(gotSeasons.objects).toHaveLength(1);
    expect(gotSeasons.objects[0]).toHaveProperty("uid", "new-season");

    // Check errors
    expect(got.errors).toHaveLength(1);
    expect(got.errors).toEqual([
      {
        object: expect.any(Object),
        targetRelationship: "seasons",
        type: HandleDropErrorType.INVALID_RELATIONSHIP_TYPE,
      },
    ]);
    expect(got.errors[0].object).toHaveProperty("uid", "invalid-episode");
  });
});

describe("handleDroppedContents", () => {
  test("receives the expected content objects and errors", () => {
    const existingOb = {
      ...panelObject,
      uid: "EXISTING_OBJECT",
      objectType: panelObject.objectType,
      // config: panelObject.config,
      // meta: panelObject.meta,
      position: 0,
      isDynamic: false,
      contextualFields: null,
    };

    const existingObjectContent: AddedSkylarkObjectContentObject[] = [
      existingOb,
    ];

    const got = handleDroppedContents({
      activeObjectUid: panelObject.uid,
      existingObjects: existingObjectContent,
      indexToInsert: droppedObjects.length + 2,
      droppedObjects: [
        ...droppedObjects,
        {
          ...panelObject,
          uid: existingOb.uid,
          // metadata: existingOb.object,
        },
      ],
    });

    // Check valid content objects
    expect(got.updatedContentObjects).toHaveLength(3);
    expect(got.updatedContentObjects[0]).toEqual(existingOb);
    expect(got.updatedContentObjects[1]).toHaveProperty(
      "uid",
      droppedObjects[1].uid,
    );
    expect(got.updatedContentObjects[1].isNewObject).toBeTruthy();
    expect(got.updatedContentObjects[2]).toHaveProperty(
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
    expect(got.errors[0].object).toHaveProperty("uid", "PANEL_OBJECT");
    expect(got.errors[1].object).toHaveProperty("uid", "new-availability");
    expect(got.errors[2].object).toHaveProperty("uid", "EXISTING_OBJECT");
  });

  test("receives the expected content objects, inserted at the correct place", () => {
    const existingOb = {
      ...panelObject,
      uid: "EXISTING_OBJECT",
      objectType: panelObject.objectType,
      // config: panelObject.config,
      // meta: panelObject.meta,
      position: 0,
      isDynamic: false,
      contextualFields: null,
    };

    const existingObjectContent: AddedSkylarkObjectContentObject[] = [
      existingOb,
    ];

    const got = handleDroppedContents({
      activeObjectUid: panelObject.uid,
      existingObjects: existingObjectContent,
      indexToInsert: 0,
      droppedObjects: droppedObjects,
    });

    // Check valid content objects
    expect(got.updatedContentObjects).toHaveLength(3);
    expect(got.updatedContentObjects[0].isNewObject).toBeTruthy();
    expect(got.updatedContentObjects[1].isNewObject).toBeTruthy();
    expect(got.updatedContentObjects[2].isNewObject).toBeFalsy();
  });
});

describe("handleDroppedAvailabilities", () => {
  test("receives the expected availability objects and errors", () => {
    const existingOb: SkylarkObject = {
      ...panelObject,
      objectType: BuiltInSkylarkObjectType.Availability,
      uid: "EXISTING_OBJECT",
      contextualFields: null,
    };

    const got = handleDroppedAvailabilities({
      activeObjectUid: panelObject.uid,
      existingObjects: [existingOb],
      droppedObjects: [...droppedObjects, existingOb],
    });

    // Check valid content objects
    expect(got.addedObjects).toHaveLength(1);
    expect(got.addedObjects[0]).toHaveProperty("uid", "new-availability");

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
    expect(got.errors[0].object).toHaveProperty("uid", "PANEL_OBJECT");
    expect(got.errors[1].object).toHaveProperty("uid", "new-season");
    expect(got.errors[2].object).toHaveProperty("uid", "new-brand");
    expect(got.errors[3].object).toHaveProperty("uid", "EXISTING_OBJECT");
  });
});
