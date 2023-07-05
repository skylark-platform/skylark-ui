import { Fragment, useEffect, useState } from "react";

import { DisplayGraphQLQuery, SearchObjectsModal } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { useGetObjectRelationships } from "src/hooks/objects/get/useGetObjectRelationships";
import {
  ParsedSkylarkObjectRelationships,
  SkylarkObjectType,
  SkylarkObjectIdentifier,
  SkylarkObjectTypes,
} from "src/interfaces/skylark";
import { parseUpdatedRelationshipObjects } from "src/lib/skylark/parsers";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  setRelationshipObjects: (relationshipObjects: {
    original: ParsedSkylarkObjectRelationships[] | null;
    updated: ParsedSkylarkObjectRelationships[] | null;
  }) => void;
  inEditMode: boolean;
  showDropZone?: boolean;
  language: string;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

export const PanelRelationships = ({
  isPage,
  objectType,
  uid,
  updatedRelationshipObjects,
  setRelationshipObjects,
  inEditMode,
  language,
  showDropZone,
  setPanelObject,
}: PanelRelationshipsProps) => {
  const {
    relationships: serverRelationships,
    objectRelationships = [],
    isLoading,
    query,
    variables,
  } = useGetObjectRelationships(objectType, uid, { language });

  const relationships = inEditMode
    ? updatedRelationshipObjects
    : serverRelationships;

  useEffect(() => {
    if (!inEditMode) {
      setRelationshipObjects({
        original: relationships,
        updated: relationships,
      });
    }
  }, [inEditMode, relationships, setRelationshipObjects]);

  const removeRelationshipObject = (removeUid: string, relationship: string) =>
    relationships &&
    setRelationshipObjects({
      original: relationships,
      updated: relationships?.map((currentRelationship) => {
        const { objects, relationshipName } = currentRelationship;
        if (relationshipName === relationship) {
          const filteredObjects = objects.filter(
            (obj) => obj.uid !== removeUid,
          );
          return { ...currentRelationship, objects: filteredObjects };
        } else return currentRelationship;
      }),
    });

  const [expandedRelationships, setExpandedRelationships] = useState<
    Record<string, boolean>
  >({});

  const relationshipNames = objectRelationships.map(
    ({ relationshipName }) => relationshipName,
  );
  const orderedRelationshipObjects = relationships?.sort(
    (a, b) =>
      relationshipNames.indexOf(a.relationshipName) -
      relationshipNames.indexOf(b.relationshipName),
  );

  const [searchObjectsModalState, setSearchObjectsModalState] = useState({
    open: false,
    objectTypes: [] as SkylarkObjectTypes,
  });

  if (showDropZone) {
    return <PanelDropZone />;
  }

  return (
    <PanelSectionLayout
      sections={relationshipNames.map((relationshipName) => ({
        id: `relationship-panel-${relationshipName}`,
        title: formatObjectField(relationshipName),
      }))}
      isPage={isPage}
    >
      <div>
        {relationships &&
          orderedRelationshipObjects?.map((relationship) => {
            const { relationshipName, objects, objectType } = relationship;
            const isExpanded = expandedRelationships[relationshipName];

            const displayList =
              objects?.length > 2 && !isExpanded
                ? objects.slice(0, 3)
                : objects;

            return (
              <div key={relationshipName} className="relative mb-8">
                <div className="flex items-center ">
                  <PanelSectionTitle
                    text={formatObjectField(relationshipName)}
                    count={(objects.length >= 50 ? "50+" : objects.length) || 0}
                    id={`relationship-panel-${relationshipName}`}
                  />
                  {/* <button
                    onClick={() =>
                      setSearchObjectsModalState({
                        open: true,
                        objectTypes: [objectType],
                      })
                    }
                    className="ml-1.5 mb-4 text-manatee-500 transition-colors hover:text-brand-primary"
                  >
                    <Plus className="h-3 w-3" />
                  </button> */}
                </div>
                <div className="transition duration-300 ease-in-out">
                  {relationship && displayList?.length > 0 ? (
                    displayList?.map((obj, index) => {
                      const relationshipObject = objectRelationships.find(
                        (relationship) =>
                          relationship.relationshipName === relationshipName,
                      );

                      const newUids =
                        relationshipObject &&
                        updatedRelationshipObjects &&
                        parseUpdatedRelationshipObjects(
                          relationshipObject,
                          updatedRelationshipObjects,
                          relationships,
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
                              disableDeleteClick={!inEditMode}
                              disableForwardClick={inEditMode}
                              onDeleteClick={() =>
                                removeRelationshipObject(
                                  obj.uid,
                                  relationshipName,
                                )
                              }
                              onForwardClick={setPanelObject}
                            >
                              {inEditMode && newUids?.includes(obj.uid) && (
                                <span
                                  className={
                                    "flex h-6 min-w-6 items-center justify-center rounded-full bg-success px-1 pb-0.5 text-center text-white transition-colors"
                                  }
                                />
                              )}
                            </ObjectIdentifierCard>
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
      <SearchObjectsModal
        isOpen={searchObjectsModalState.open}
        objectTypes={searchObjectsModalState.objectTypes}
        setIsOpen={() =>
          setSearchObjectsModalState({
            ...searchObjectsModalState,
            open: !searchObjectsModalState.open,
          })
        }
      />
      {inEditMode && !isPage && (
        <p className="w-full py-4 text-center text-sm text-manatee-600">
          {"Drag an object from the Content Library to add as relationship"}
        </p>
      )}
    </PanelSectionLayout>
  );
};
