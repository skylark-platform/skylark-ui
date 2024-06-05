import { QueryClient } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import { refetchSearchQueriesAfterUpdate } from "src/hooks/objects/useCreateObject";
import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  ParsedSkylarkObjectRelationships,
  BuiltInSkylarkObjectType,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { hasProperty, insertAtIndex } from "src/lib/utils";

export enum HandleDropErrorType {
  "EXISTING_LINK" = "EXISTING_LINK",
  "INVALID_OBJECT_TYPE" = "INVALID_OBJECT_TYPE",
  "INVALID_RELATIONSHIP_TYPE" = "INVALID_RELATIONSHIP_TYPE",
  "OBJECTS_ARE_SAME" = "OBJECTS_ARE_SAME",
}

export type HandleGenericDropError = {
  object: ParsedSkylarkObject;
  type:
    | HandleDropErrorType.EXISTING_LINK
    | HandleDropErrorType.INVALID_OBJECT_TYPE
    | HandleDropErrorType.OBJECTS_ARE_SAME;
};

export type HandleRelationshipDropError = {
  object: ParsedSkylarkObject;
  type: HandleDropErrorType.INVALID_RELATIONSHIP_TYPE;
  targetRelationship: string;
};

export type HandleDropError =
  | HandleGenericDropError
  | HandleRelationshipDropError;

export const refetchPanelQueries = async (
  client: QueryClient,
  objectType: string,
  uid: string,
) => {
  const queryCache = client.getQueryCache();

  const queryKeys = queryCache
    .getAll()
    .map((cache) => cache.queryKey)
    .filter(
      (key) =>
        (key?.[0] as string).startsWith(QueryKeys.GetObject) &&
        (key.length === 1 ||
          (hasProperty(key[1], "objectType") &&
            hasProperty(key[1], "uid") &&
            key[1]?.objectType === objectType &&
            key[1]?.uid === uid)),
    );

  await Promise.all(
    queryKeys.map((queryKey) =>
      client.refetchQueries({
        queryKey,
      }),
    ),
  );
};

export const pollPanelRefetch = (
  client: QueryClient,
  objectType: string,
  uid: string,
) => {
  let timesRun = 0;
  const interval = setInterval(() => {
    timesRun += 1;
    if (timesRun === 50) {
      clearInterval(interval);
    }

    void refetchPanelQueries(client, objectType, uid);
    if (timesRun % 10 === 0) {
      void refetchSearchQueriesAfterUpdate(client);
    }
  }, 750);

  return interval;
};

export const convertSkylarkObjectToContentObject = (
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
  targetRelationship,
}: {
  existingObjects: ParsedSkylarkObjectRelationships;
  objectMetaRelationships: SkylarkObjectMeta["relationships"];
  activeObjectUid: string;
  droppedObjects: ParsedSkylarkObject[];
  targetRelationship?: string | null;
}): {
  count: number;
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships;
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
        updatedRelationshipObjects: ParsedSkylarkObjectRelationships;
        addedObjects: Record<string, ParsedSkylarkObject[]>;
        errors: HandleDropError[];
      } => {
        const targetRelationshipMeta =
          (targetRelationship &&
            objectMetaRelationships.find(
              (relationship) =>
                relationship.relationshipName === targetRelationship,
            )) ||
          null;

        if (
          targetRelationship &&
          targetRelationshipMeta &&
          droppedObject.objectType !== targetRelationshipMeta.objectType
        ) {
          const error: HandleDropError = {
            type: HandleDropErrorType.INVALID_RELATIONSHIP_TYPE,
            object: droppedObject,
            targetRelationship,
          };
          return {
            ...previous,
            errors: [...previous.errors, error],
          };
        }

        // Unless the relationshipName is passed in, we make a best guess based on the object type
        const droppedObjectRelationshipMeta =
          targetRelationshipMeta ||
          objectMetaRelationships.find(
            (relationship) =>
              relationship.objectType === droppedObject.objectType,
          );

        if (!droppedObjectRelationshipMeta) {
          const error: HandleDropError = {
            type: HandleDropErrorType.INVALID_OBJECT_TYPE,
            object: droppedObject,
          };
          return {
            ...previous,
            errors: [...previous.errors, error],
          };
        }

        const droppedObjectRelationshipName =
          droppedObjectRelationshipMeta?.relationshipName;

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

        const droppedObjectRelationshipObjects =
          existingObjects?.[droppedObjectRelationshipMeta.relationshipName];

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

        const updatedRelationshipObjects = Object.fromEntries(
          Object.entries(previous.updatedRelationshipObjects).map(
            ([relationshipName, relationship]) => {
              const { objects } = relationship;
              if (relationshipName === droppedObjectRelationshipName) {
                return [
                  relationshipName,
                  {
                    ...relationship,
                    objects: [droppedObject, ...objects],
                  },
                ];
              } else return [relationshipName, relationship];
            },
          ),
        );

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
  activeObjectUid,
  droppedObjects,
  indexToInsert,
}: {
  existingObjects: AddedSkylarkObjectContentObject[];
  activeObjectUid: string;
  droppedObjects: ParsedSkylarkObject[];
  indexToInsert: number;
}): {
  updatedContentObjects: AddedSkylarkObjectContentObject[];
  errors: HandleDropError[];
} => {
  const { newContentObjects, errors } = droppedObjects.reduce(
    (
      previous,
      droppedObject,
    ): {
      newContentObjects: AddedSkylarkObjectContentObject[];
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

      const parseDroppedContent =
        convertSkylarkObjectToContentObject(droppedObject);

      return {
        ...previous,
        newContentObjects: [
          ...previous.newContentObjects,
          {
            ...parseDroppedContent,
            position: -1,
            isNewObject: true,
          },
        ],
      };
    },
    {
      newContentObjects: [] as AddedSkylarkObjectContentObject[],
      errors: [] as HandleDropError[],
    },
  );

  const updatedContentObjects = insertAtIndex(
    existingObjects,
    indexToInsert,
    newContentObjects,
  ).map((obj, i) => ({
    ...obj,
    position: obj.isNewObject ? i + 1 : obj.position,
  }));

  return { updatedContentObjects, errors };
};

export const handleDroppedAvailabilities = ({
  existingObjects,
  droppedObjects,
  activeObjectUid,
}: {
  existingObjects: ParsedSkylarkObject[];
  droppedObjects: ParsedSkylarkObject[];
  activeObjectUid: string;
}) => {
  const { addedObjects, errors } = droppedObjects.reduce(
    (
      previous,
      droppedObject,
    ): {
      addedObjects: ParsedSkylarkObject[];
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
        addedObjects: [...previous.addedObjects, droppedObject],
      };
    },
    {
      addedObjects: [] as ParsedSkylarkObject[],
      errors: [] as HandleDropError[],
    },
  );

  return {
    addedObjects,
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
