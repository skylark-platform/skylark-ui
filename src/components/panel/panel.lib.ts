import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  ParsedSkylarkObjectRelationships,
  BuiltInSkylarkObjectType,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

export enum HandleDropErrorType {
  "EXISTING_LINK" = "EXISTING_LINK",
  "INVALID_OBJECT_TYPE" = "INVALID_OBJECT_TYPE",
  "OBJECTS_ARE_SAME" = "OBJECTS_ARE_SAME",
}

export interface HandleDropError {
  object: ParsedSkylarkObject;
  type: HandleDropErrorType;
}

const parseSkylarkObjectContent = (
  skylarkObject: ParsedSkylarkObject,
): ParsedSkylarkObjectContentObject => {
  return {
    config: skylarkObject.config,
    meta: skylarkObject.meta,
    object: skylarkObject.metadata,
    objectType: skylarkObject.objectType,
    position: 1,
  };
};

export const handleDroppedRelationships = ({
  existingObjects,
  objectMetaRelationships,
  activeObjectUid,
  droppedObjects,
  relationshipName,
}: {
  existingObjects: ParsedSkylarkObjectRelationships[];
  objectMetaRelationships: SkylarkObjectMeta["relationships"];
  activeObjectUid: string;
  droppedObjects: ParsedSkylarkObject[];
  relationshipName?: string;
}): {
  count: number;
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[];
  addedObjects: Record<string, ParsedSkylarkObject[]>;
  errors: HandleDropError[];
} => {
  const { count, updatedRelationshipObjects, errors, addedObjects } =
    droppedObjects.reduce(
      (
        previous,
        droppedObject,
      ): {
        count: number;
        updatedRelationshipObjects: ParsedSkylarkObjectRelationships[];
        addedObjects: Record<string, ParsedSkylarkObject[]>;
        errors: HandleDropError[];
      } => {
        // Unless the relationshipName is passed in, we make a best guess based on the object type
        const droppedObjectRelationshipName =
          relationshipName ||
          objectMetaRelationships.find(
            (relationship) =>
              relationship.objectType === droppedObject.objectType,
          )?.relationshipName;

        if (!droppedObjectRelationshipName) {
          const error: HandleDropError = {
            type: HandleDropErrorType.INVALID_OBJECT_TYPE,
            object: droppedObject,
          };
          return {
            ...previous,
            errors: [...previous.errors, error],
          };
        }

        if (activeObjectUid === droppedObject.uid) {
          const error: HandleDropError = {
            type: HandleDropErrorType.OBJECTS_ARE_SAME,
            object: droppedObject,
          };
          return {
            ...previous,
            errors: [...previous.errors, error],
          };
        }

        const droppedObjectRelationshipObjects = existingObjects.find(
          (relationship) =>
            relationship.relationshipName === droppedObjectRelationshipName,
        );

        const isAlreadyAdded = !!droppedObjectRelationshipObjects?.objects.find(
          ({ uid }) => droppedObject.uid === uid,
        );

        if (isAlreadyAdded) {
          const error: HandleDropError = {
            type: HandleDropErrorType.EXISTING_LINK,
            object: droppedObject,
          };
          return {
            ...previous,
            errors: [...previous.errors, error],
          };
        }

        const updatedRelationshipObjects =
          previous.updatedRelationshipObjects.map((relationship) => {
            const { objects, relationshipName } = relationship;
            if (relationshipName === droppedObjectRelationshipName) {
              return {
                ...relationship,
                objects: [droppedObject, ...objects],
              };
            } else return relationship;
          });

        const addedObjects = {
          ...previous.addedObjects,
          [droppedObjectRelationshipName]: hasProperty(
            previous.addedObjects,
            droppedObjectRelationshipName,
          )
            ? [
                ...previous.addedObjects[droppedObjectRelationshipName],
                droppedObject,
              ]
            : [droppedObject],
        };

        return {
          count: (previous.count += 1),
          updatedRelationshipObjects,
          addedObjects,
          errors: previous.errors,
        };
      },
      {
        count: 0,
        updatedRelationshipObjects: existingObjects,
        addedObjects: {} as Record<string, ParsedSkylarkObject[]>,
        errors: [] as HandleDropError[],
      },
    );

  return {
    count,
    updatedRelationshipObjects,
    addedObjects,
    errors,
  };
};

export const handleDroppedContents = ({
  existingObjects,
  panelObject,
  droppedObjects,
}: {
  existingObjects: AddedSkylarkObjectContentObject[];
  panelObject: ParsedSkylarkObject;
  droppedObjects: ParsedSkylarkObject[];
}): {
  updatedContentObjects: AddedSkylarkObjectContentObject[];
  errors: HandleDropError[];
} => {
  const { updatedContentObjects, errors } = droppedObjects.reduce(
    (
      previous,
      droppedObject,
      index,
    ): {
      updatedContentObjects: AddedSkylarkObjectContentObject[];
      errors: HandleDropError[];
    } => {
      if (droppedObject.objectType === BuiltInSkylarkObjectType.Availability) {
        const error: HandleDropError = {
          type: HandleDropErrorType.INVALID_OBJECT_TYPE,
          object: droppedObject,
        };
        return {
          ...previous,
          errors: [...previous.errors, error],
        };
      }

      if (panelObject.uid === droppedObject.uid) {
        const error: HandleDropError = {
          type: HandleDropErrorType.OBJECTS_ARE_SAME,
          object: droppedObject,
        };
        return {
          ...previous,
          errors: [...previous.errors, error],
        };
      }

      if (
        existingObjects?.find(
          ({ object: { uid } }) => uid === droppedObject.uid,
        )
      ) {
        const error: HandleDropError = {
          type: HandleDropErrorType.EXISTING_LINK,
          object: droppedObject,
        };
        return {
          ...previous,
          errors: [...previous.errors, error],
        };
      }

      const parseDroppedContent = parseSkylarkObjectContent(droppedObject);

      return {
        ...previous,
        updatedContentObjects: [
          ...previous.updatedContentObjects,
          {
            ...parseDroppedContent,
            position: existingObjects.length + index + 1,
            isNewObject: true,
          },
        ],
      };
    },
    { updatedContentObjects: existingObjects, errors: [] as HandleDropError[] },
  );

  return { updatedContentObjects, errors };
};

export const handleDroppedAvailabilities = ({
  existingObjects,
  droppedObjects,
  panelObject,
}: {
  existingObjects: ParsedSkylarkObject[];
  droppedObjects: ParsedSkylarkObject[];
  panelObject: ParsedSkylarkObject;
}) => {
  const { updatedAvailabilityObjects, errors } = droppedObjects.reduce(
    (
      previous,
      droppedObject,
    ): {
      updatedAvailabilityObjects: ParsedSkylarkObject[];
      errors: HandleDropError[];
    } => {
      if (droppedObject.objectType !== BuiltInSkylarkObjectType.Availability) {
        const error: HandleDropError = {
          type: HandleDropErrorType.INVALID_OBJECT_TYPE,
          object: droppedObject,
        };
        return {
          ...previous,
          errors: [...previous.errors, error],
        };
      }

      if (panelObject.uid === droppedObject.uid) {
        const error: HandleDropError = {
          type: HandleDropErrorType.OBJECTS_ARE_SAME,
          object: droppedObject,
        };
        return {
          ...previous,
          errors: [...previous.errors, error],
        };
      }

      if (existingObjects.find(({ uid }) => uid === droppedObject.uid)) {
        const error: HandleDropError = {
          type: HandleDropErrorType.EXISTING_LINK,
          object: droppedObject,
        };
        return {
          ...previous,
          errors: [...previous.errors, error],
        };
      }

      return {
        ...previous,
        updatedAvailabilityObjects: [
          ...previous.updatedAvailabilityObjects,
          droppedObject,
        ],
      };
    },
    {
      updatedAvailabilityObjects: existingObjects,
      errors: [] as HandleDropError[],
    },
  );

  return {
    updatedAvailabilityObjects,
    errors,
  };
};

export const handleDroppedObjectsToAssignToAvailability = ({
  newObjects,
}: {
  newObjects: ParsedSkylarkObject[];
}): {
  updatedAssignedToObjects: ParsedSkylarkObject[];
  errors: HandleDropError[];
} => {
  const { updatedAssignedToObjects, errors } = newObjects.reduce(
    (
      previous,
      newObject,
    ): {
      updatedAssignedToObjects: ParsedSkylarkObject[];
      errors: HandleDropError[];
    } => {
      if (newObject.objectType === BuiltInSkylarkObjectType.Availability) {
        const error: HandleDropError = {
          type: HandleDropErrorType.INVALID_OBJECT_TYPE,
          object: newObject,
        };
        return {
          ...previous,
          errors: [...previous.errors, error],
        };
      }

      const updatedAssignedToObjects = [
        ...previous.updatedAssignedToObjects,
        newObject,
      ];

      return {
        ...previous,
        updatedAssignedToObjects,
      };
    },
    {
      updatedAssignedToObjects: [] as ParsedSkylarkObject[],
      errors: [] as HandleDropError[],
    },
  );

  return { updatedAssignedToObjects, errors };
};
