import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";

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
  ParsedSkylarkObjectRelationships,
  SkylarkObjectType,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { parseUpdatedRelationshipObjects } from "src/lib/skylark/parsers";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  originalRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  setRelationshipObjects: (relationshipObjects: {
    originalRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
    updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  }) => void;
  inEditMode: boolean;
  showDropArea?: boolean;
  language: string;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

export const PanelRelationships = ({
  isPage,
  objectType,
  uid,
  updatedRelationshipObjects,
  setRelationshipObjects,
  originalRelationshipObjects,
  inEditMode,
  language,
  showDropArea,
  setPanelObject,
}: PanelRelationshipsProps) => {
  const {
    data: relationshipsData,
    relationships = [],
    isLoading,
    query,
    variables,
  } = useGetObjectRelationships(objectType, uid, { language });

  useEffect(() => {
    if (originalRelationshipObjects === null) {
      setRelationshipObjects({
        updatedRelationshipObjects: relationshipsData,
        originalRelationshipObjects: relationshipsData,
      });
    }
  }, [originalRelationshipObjects, relationshipsData, setRelationshipObjects]);

  const removeRelationshipObject = (removeUid: string, relationship: string) =>
    updatedRelationshipObjects &&
    setRelationshipObjects({
      updatedRelationshipObjects: updatedRelationshipObjects?.map(
        (currentRelationship) => {
          const { objects, relationshipName } = currentRelationship;
          if (relationshipName === relationship) {
            const filteredObjects = objects.filter(
              (obj) => obj.uid !== removeUid,
            );
            return { ...currentRelationship, objects: filteredObjects };
          } else return currentRelationship;
        },
      ),
      originalRelationshipObjects,
    });

  const [expandedRelationships, setExpandedRelationships] = useState<
    Record<string, boolean>
  >({});
  const { isOver, setNodeRef } = useDroppable({
    id: DROPPABLE_ID,
  });

  if (showDropArea)
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          isOver && "border-primary text-primary",
          "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-manatee-400",
        )}
      >
        <span>{`Drag an object from the Content Library to add as a relationship`}</span>
      </div>
    );

  return (
    <PanelSectionLayout
      sections={relationships.map(({ relationshipName }) => ({
        id: `relationship-panel-${relationshipName}`,
        title: formatObjectField(relationshipName),
      }))}
      isPage={isPage}
    >
      <div>
        {updatedRelationshipObjects?.map((relationship) => {
          const { relationshipName, objects } = relationship;
          const isExpanded = expandedRelationships[relationshipName];

          const displayList =
            objects?.length > 2 && !isExpanded ? objects.slice(0, 3) : objects;

          return (
            <div key={relationshipName} className="relative mb-8">
              <PanelSectionTitle
                text={formatObjectField(relationshipName)}
                count={(objects.length >= 50 ? "50+" : objects.length) || 0}
                id={`relationship-panel-${relationshipName}`}
              />

              <div className="transition duration-300 ease-in-out">
                {relationship && displayList?.length > 0 ? (
                  displayList?.map((obj, index) => {
                    const relationshipObject = relationships.find(
                      (relationship) =>
                        relationship.relationshipName === relationshipName,
                    );

                    const newUids =
                      relationshipObject &&
                      originalRelationshipObjects &&
                      parseUpdatedRelationshipObjects(
                        relationshipObject,
                        updatedRelationshipObjects,
                        originalRelationshipObjects,
                      ).uidsToLink;

                    return (
                      <Fragment key={obj.uid}>
                        <div
                          className="flex items-center "
                          data-testid={`panel-relationship-${relationshipName}-item-${
                            index + 1
                          }`}
                        >
                          <ObjectIdentifierCard
                            key={obj.uid}
                            object={obj}
                            onForwardClick={setPanelObject}
                          />
                          {inEditMode && newUids?.includes(obj.uid) && (
                            <span
                              className={
                                "flex h-6 min-w-6 items-center justify-center rounded-full bg-success px-1 pb-0.5 text-center text-white transition-colors"
                              }
                            />
                          )}
                          <button
                            disabled={!inEditMode}
                            data-testid={`panel-relationship-${relationshipName}-item-${
                              index + 1
                            }-remove`}
                            onClick={() =>
                              removeRelationshipObject(
                                obj.uid,
                                relationshipName,
                              )
                            }
                          >
                            <Trash
                              className={clsx(
                                "ml-2 flex h-6 text-manatee-300 transition-all hover:text-error",
                                inEditMode ? "w-6" : "w-0",
                              )}
                            />
                          </button>
                        </div>

                        {index < displayList.length - 1 && <PanelSeparator />}
                      </Fragment>
                    );
                  })
                ) : (
                  <PanelEmptyDataText />
                )}
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
    </PanelSectionLayout>
  );
};
