import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useEffect, useState } from "react";

import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { Trash } from "src/components/icons";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { DROPPABLE_ID } from "src/constants/skylark";
import { useGetObjectRelationships } from "src/hooks/useGetObjectRelationships";
import {
  ParsedSkylarkObject,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectRelationship,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface PanelRelationshipsProps {
  objectType: SkylarkObjectType;
  uid: string;
  newRelationshipObjects: ParsedSkylarkObject[];
  setNewRelationshipObjects: (objs: ParsedSkylarkObject[]) => void;
  removedRelationshipObjects: { [key: string]: string[] } | null;
  setRemovedRelationshipObjects: (uids: { [key: string]: string[] }) => void;
  inEditMode: boolean;
  showDropArea?: boolean;
  language: string;
}

export const groupObjectsByRelationship = (
  objects: ParsedSkylarkObject[],
  relationships: SkylarkObjectRelationship[],
): { [k: string]: ParsedSkylarkObject[] } => {
  return objects.reduce((acc: { [k: string]: ParsedSkylarkObject[] }, cv) => {
    const key: string | undefined = relationships.find(
      (relationship) => relationship.objectType === cv.objectType,
    )?.relationshipName;

    // at this point i already know that is a valid relationship anw
    if (key) {
      const current = acc[key] || [];
      return { ...acc, [key]: [...current, cv] };
    }
    return acc;
  }, {});
};

const isDuplicate = (
  findUid: string,
  relationshipObjects: ParsedSkylarkObject[],
) => !!relationshipObjects.find(({ uid }) => uid === findUid);

export const PanelRelationships = ({
  objectType,
  uid,
  newRelationshipObjects,
  setNewRelationshipObjects,
  removedRelationshipObjects,
  setRemovedRelationshipObjects,
  inEditMode,
  language,
  showDropArea,
}: PanelRelationshipsProps) => {
  const {
    data: relationshipsData,
    relationships = [],
    isLoading,
    query,
    variables,
  } = useGetObjectRelationships(objectType, uid, { language });

  // this is used for display only
  const [updatedRelationshipObjects, setUpdatedRelationshipObjects] = useState<
    ParsedSkylarkObjectRelationships[] | null
  >(null);

  useEffect(() => {
    if (updatedRelationshipObjects === null && relationshipsData) {
      setUpdatedRelationshipObjects(relationshipsData);
    }
  }, [relationshipsData, updatedRelationshipObjects]);

  // handle remove from saved/current objects
  const removeRelationshipObject = (
    removeUid: string,
    isNewObject?: boolean,
  ) => {
    if (isNewObject) {
      newRelationshipObjects.filter(({ uid }) => {
        uid === removeUid;
      });
      setNewRelationshipObjects(
        newRelationshipObjects.filter(({ uid }) => {
          uid === removeUid;
        }),
      );
    }

    if (updatedRelationshipObjects) {
      const filteredUpdatedRelationshipObjects = updatedRelationshipObjects.map(
        (currentRelationship) => {
          const { objects, relationshipName } = currentRelationship;

          const itemToRemove = objects.find((obj) => obj.uid == removeUid);
          if (itemToRemove) {
            const test = groupObjectsByRelationship(
              [itemToRemove],
              relationships,
            );
            console.log("a big test", test);

            if (
              removedRelationshipObjects &&
              removedRelationshipObjects[relationshipName]
            )
              setRemovedRelationshipObjects({
                ...removedRelationshipObjects,
                [relationshipName]: [
                  ...removedRelationshipObjects[relationshipName],
                  removeUid,
                ],
              });
            else if (removedRelationshipObjects) {
              setRemovedRelationshipObjects({
                ...removedRelationshipObjects,
                [relationshipName]: [removeUid],
              });
            } else {
              setRemovedRelationshipObjects({
                [relationshipName]: [removeUid],
              });
            }

            //filters current object
            const o = objects.filter((obj) => obj.uid !== removeUid);
            return { ...currentRelationship, objects: o };
          }

          return currentRelationship;
        },
      );

      //hides the relationship from the state array (this is used to ui only)
      setUpdatedRelationshipObjects(filteredUpdatedRelationshipObjects);
    }
  };

  const [expandedRelationships, setExpandedRelationships] = useState<
    Record<string, boolean>
  >({});
  const { isOver, setNodeRef } = useDroppable({
    id: DROPPABLE_ID,
  });

  const groupedNewRelationshipObjects = groupObjectsByRelationship(
    newRelationshipObjects,
    relationships,
  );

  if (showDropArea)
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          isOver && "border-primary text-primary",
          "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-manatee-400",
        )}
      >
        <span>{`Drop object here to add as relationship of ${objectType}  `}</span>
      </div>
    );

  return (
    <div className="relative h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {updatedRelationshipObjects &&
          updatedRelationshipObjects.map((relationship) => {
            const { relationshipName, objects } = relationship;
            const isExpanded = expandedRelationships[relationshipName];

            const displayList =
              objects?.length > 2 && !isExpanded
                ? objects.slice(0, 3)
                : objects;

            return (
              <div key={relationshipName} className="relative mb-8">
                <PanelSectionTitle
                  text={formatObjectField(relationshipName)}
                  count={(objects.length >= 50 ? "50+" : objects.length) || 0}
                />

                <div className="transition duration-300 ease-in-out">
                  <>
                    {groupedNewRelationshipObjects[relationshipName]?.map(
                      (obj, index) =>
                        !isDuplicate(obj.uid, displayList) && (
                          <>
                            <div className="flex items-center" key={obj.uid}>
                              <ObjectIdentifierCard
                                key={obj.uid}
                                object={obj}
                              />
                              <span
                                className={
                                  "flex h-6 min-w-6 items-center justify-center rounded-full bg-success px-1 pb-0.5 text-center text-white transition-colors"
                                }
                              />

                              <button
                                onClick={() =>
                                  removeRelationshipObject(obj.uid, true)
                                }
                              >
                                <Trash
                                  className={
                                    "ml-2 flex h-6 w-6 text-manatee-300 transition-all hover:text-error"
                                  }
                                />
                              </button>
                            </div>
                            {index <
                              groupedNewRelationshipObjects[relationshipName]
                                .length -
                                1 && <PanelSeparator />}
                          </>
                        ),
                    )}
                    {relationship && displayList?.length > 0 ? (
                      displayList?.map((obj, index) => (
                        <>
                          <div className="flex">
                            <ObjectIdentifierCard key={obj.uid} object={obj} />
                            <button
                              disabled={!inEditMode}
                              data-testid={`panel-object-content-item-${
                                index + 1
                              }-remove`}
                              onClick={() => removeRelationshipObject(obj.uid)}
                            >
                              <Trash
                                className={clsx(
                                  "ml-2 flex h-6 w-6 text-manatee-300 transition-all hover:text-error",
                                  inEditMode ? "w-6" : "w-0",
                                )}
                              />
                            </button>
                          </div>

                          {index < displayList.length - 1 && <PanelSeparator />}
                        </>
                      ))
                    ) : (
                      <PanelEmptyDataText />
                    )}
                  </>
                </div>

                {relationship && objects.length > 3 && (
                  <div className="mb-3">
                    <PanelSeparator />
                    <button
                      data-testid={`expand-relationship-${relationshipName}`}
                      onClick={() =>
                        setExpandedRelationships({
                          [relationshipName]: !isExpanded,
                        })
                      }
                      className="w-full cursor-pointer p-2 text-center text-xs text-manatee-500 hover:text-manatee-700"
                    >
                      {`Show ${isExpanded ? "less" : "more"}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <PanelLoading isLoading={isLoading} />
      <DisplayGraphQLQuery
        label="Get Object Relationships"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
    </div>
  );
};
