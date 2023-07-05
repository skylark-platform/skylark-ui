import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  ParsedSkylarkObjectRelationships,
  BuiltInSkylarkObjectType,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";

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
  panelObject,
  droppedObjects,
}: {
  existingObjects: ParsedSkylarkObjectRelationships[];
  objectMetaRelationships: SkylarkObjectMeta["relationships"];
  panelObject: ParsedSkylarkObject;
  droppedObjects: ParsedSkylarkObject[];
}): {
  count: number;
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[];
  errors: HandleDropError[];
} => {
  const { count, updatedRelationshipObjects, errors } = droppedObjects.reduce(
    (
      previous,
      droppedObject,
    ): {
      count: number;
      updatedRelationshipObjects: ParsedSkylarkObjectRelationships[];
      errors: HandleDropError[];
    } => {
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

      const droppedObjectRelationshipName = objectMetaRelationships.find(
        (relationship) => relationship.objectType === droppedObject.objectType,
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

      return {
        count: (previous.count += 1),
        updatedRelationshipObjects,
        errors: previous.errors,
      };
    },
    {
      count: 0,
      updatedRelationshipObjects: existingObjects,
      errors: [] as HandleDropError[],
    },
  );

  return {
    count,
    updatedRelationshipObjects,
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
