import { sentenceCase } from "change-case";
import { AnimatePresence } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

import { DisplayGraphQLQuery, SearchObjectsModal } from "src/components/modals";
import {
  HandleDropError,
  handleDroppedRelationships,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import { PanelSeparator } from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useIsDragging } from "src/hooks/dnd/useIsDragging";
import { usePanelDropzone } from "src/hooks/dnd/usePanelDropzone";
import { useGetObjectRelationships } from "src/hooks/objects/get/useGetObjectRelationships";
import { PanelTab, PanelTabState, SetPanelObject } from "src/hooks/state";
import { useObjectTypeRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  SkylarkObjectRelationships,
  SkylarkObjectType,
  SkylarkObjectRelationship,
  ParsedSkylarkRelationshipConfig,
  ModifiedRelationshipsObject,
  ModifiedRelationship,
  SkylarkObject,
} from "src/interfaces/skylark";
import { DragType, DroppableType } from "src/lib/dndkit/dndkit";
import { formatObjectField, hasProperty } from "src/lib/utils";

import { PanelRelationshipSection } from "./panelRelationshipsSection.component";
import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  tabState: PanelTabState[PanelTab.Relationships];
  modifiedRelationships: ModifiedRelationshipsObject;
  setModifiedRelationships: (
    rels: ModifiedRelationshipsObject,
    errors: HandleDropError[],
  ) => void;
  inEditMode: boolean;
  language: string;
  setPanelObject: SetPanelObject;
  updateActivePanelTabState: (s: Partial<PanelTabState>) => void;
}

const sortByRelationshipName = (
  relationshipNames: string[],
  arr: SkylarkObjectRelationship[] | null,
) =>
  arr?.sort(
    (a, b) =>
      relationshipNames.indexOf(a.name) - relationshipNames.indexOf(b.name),
  ) || [];

const splitRelationshipsIntoSections = (
  relationshipNames: string[],
  relationships: SkylarkObjectRelationships | null,
) =>
  sortByRelationshipName(
    relationshipNames,
    relationships ? Object.values(relationships) : null,
  ).reduce(
    (previous, relationship) => {
      if (relationship.objects.length > 0) {
        return {
          ...previous,
          orderedRelationships: [
            ...previous.orderedRelationships,
            relationship,
          ],
        };
      }

      return {
        ...previous,
        emptyOrderedRelationships: [
          ...previous.emptyOrderedRelationships,
          relationship,
        ],
      };
    },
    {
      orderedRelationships: [],
      emptyOrderedRelationships: [],
    } as {
      orderedRelationships: SkylarkObjectRelationship[];
      emptyOrderedRelationships: SkylarkObjectRelationship[];
    },
  );

const filterWhenExpandedRelationship = (
  relationships: SkylarkObjectRelationship[],
  expandedRelationship: string | null,
) =>
  expandedRelationship
    ? relationships.filter(
        (relationship) => relationship.name === expandedRelationship,
      )
    : relationships;

const addModifiedRelationshipsOntoRelationships = (
  relationships: SkylarkObjectRelationships | null,
  modifiedRelationships: PanelRelationshipsProps["modifiedRelationships"],
): SkylarkObjectRelationships | null => {
  if (!relationships) {
    return null;
  }

  const updatedRelationships = Object.fromEntries(
    Object.entries(relationships).map(([relationshipName, relationship]) => {
      const { objects } = relationship;

      const modifedRelations = hasProperty(
        modifiedRelationships,
        relationshipName,
      )
        ? modifiedRelationships[relationshipName]
        : null;

      if (!modifedRelations) {
        return [relationshipName, relationship];
      }

      const { added, removed } = modifedRelations;

      const withRemovedFilteredOut = [...objects, ...added].filter(
        ({ uid }) => !removed.includes(uid),
      );

      return [
        relationshipName,
        {
          ...relationship,
          objects: withRemovedFilteredOut,
        },
      ];
    }),
  );

  return updatedRelationships;
};

const getNewUidsForRelationship = (
  relationshipName: string,
  modifiedRelationships: PanelRelationshipsProps["modifiedRelationships"],
) =>
  hasProperty(modifiedRelationships, relationshipName)
    ? modifiedRelationships[relationshipName].added.map(({ uid }) => uid)
    : [];

const updateModifiedObjectsWithAddedObjects = (
  modifiedRelationships: PanelRelationshipsProps["modifiedRelationships"],
  addedObjects: Record<string, SkylarkObject[]>,
) => {
  const updatedModifiedRelationships: PanelRelationshipsProps["modifiedRelationships"] =
    Object.fromEntries(
      Object.entries(addedObjects).map(([relationshipName, objects]) => {
        if (!hasProperty(modifiedRelationships, relationshipName)) {
          return [relationshipName, { added: objects, removed: [] }];
        }

        return [
          relationshipName,
          {
            ...modifiedRelationships[relationshipName],
            added: [
              ...modifiedRelationships[relationshipName].added,
              ...objects,
            ],
          },
        ];
      }),
    );

  return {
    ...modifiedRelationships,
    ...updatedModifiedRelationships,
  };
};

const parseAddedAndRemovedRelationshipObjects = (
  existing: ModifiedRelationship,
  added: SkylarkObject[],
  removed: string[],
): ModifiedRelationship => {
  const updatedAdded = added ? [...existing.added, ...added] : existing.added;
  const updatedRemoved = removed
    ? [...existing.removed, ...removed]
    : existing.removed;

  const duplicates = updatedAdded
    .filter(({ uid }) => updatedRemoved.includes(uid))
    .map(({ uid }) => uid);

  return {
    added: updatedAdded.filter(({ uid }) => !duplicates.includes(uid)),
    removed: updatedRemoved.filter((uid) => !duplicates.includes(uid)),
    config: existing.config,
  };
};

export const PanelRelationships = ({
  isPage,
  objectType,
  uid,
  modifiedRelationships,
  setModifiedRelationships,
  inEditMode,
  language,
  tabState,
  setPanelObject,
  updateActivePanelTabState,
}: PanelRelationshipsProps) => {
  const [activeRelationship, setActiveRelationship] = useState<string | null>(
    tabState.active,
  );

  const {
    relationships: serverRelationships,
    relationshipsWithNextPage,
    objectRelationships: objectMetaRelationships = [],
    isLoading,
    isFetchingNextPage: isFetchingMoreRelationships,
    query,
    variables,
    fetchNextPage,
  } = useGetObjectRelationships(objectType, uid, { language });

  const { objectTypeRelationshipConfig } =
    useObjectTypeRelationshipConfiguration(objectType);

  const relationships = useMemo(
    () =>
      inEditMode
        ? addModifiedRelationshipsOntoRelationships(
            serverRelationships,
            modifiedRelationships,
          )
        : serverRelationships,
    [inEditMode, modifiedRelationships, serverRelationships],
  );

  const [showDropZone] = useIsDragging(DragType.CONTENT_LIBRARY_OBJECT);

  usePanelDropzone(DroppableType.PANEL_GENERIC, {
    onObjectsDropped: (droppedObjects) => {
      if (!relationships) {
        return;
      }

      const { addedObjects, errors } = handleDroppedRelationships({
        droppedObjects,
        activeObjectUid: uid,
        existingObjects: relationships,
        objectMetaRelationships,
        targetRelationship: activeRelationship,
      });

      setModifiedRelationships(
        updateModifiedObjectsWithAddedObjects(
          modifiedRelationships,
          addedObjects,
        ),
        errors,
      );
    },
  });

  const modifyRelationshipObjects = (
    relationshipName: string,
    { added, removed }: { added?: SkylarkObject[]; removed?: string[] },
  ) => {
    const relationship = hasProperty(modifiedRelationships, relationshipName)
      ? modifiedRelationships[relationshipName]
      : { added: [], removed: [], config: {} };

    setModifiedRelationships(
      {
        ...modifiedRelationships,
        [relationshipName]: parseAddedAndRemovedRelationshipObjects(
          relationship,
          added || [],
          removed || [],
        ),
      },
      [],
    );
  };

  const modifyRelationshipConfig = (
    relationshipName: string,
    config: Partial<ParsedSkylarkRelationshipConfig>,
  ) => {
    const relationship = hasProperty(modifiedRelationships, relationshipName)
      ? modifiedRelationships[relationshipName]
      : { added: [], removed: [], config: {} };

    setModifiedRelationships(
      {
        ...modifiedRelationships,
        [relationshipName]: {
          ...relationship,
          config: {
            ...relationship.config,
            ...config,
          },
        },
      },
      [],
    );
  };

  const relationshipNames = objectMetaRelationships.map(
    ({ relationshipName }) => relationshipName,
  );

  const scrollDivRef = useRef<HTMLDivElement | null>(null);

  const setActiveRelationshipWrapper = useCallback(
    (name: string | null) => {
      if (name)
        scrollDivRef.current?.scrollTo?.({ top: 0, behavior: "instant" });
      setActiveRelationship(name);
      updateActivePanelTabState({
        [PanelTab.Relationships]: { active: name },
      });
    },
    [updateActivePanelTabState],
  );

  const { orderedRelationships, emptyOrderedRelationships } =
    splitRelationshipsIntoSections(relationshipNames, relationships);

  const [searchObjectsModalState, setSearchObjectsModalState] = useState<{
    relationship: SkylarkObjectRelationship;
    fields?: string[];
  } | null>(null);

  if (showDropZone) {
    return <PanelDropZone />;
  }

  return (
    <PanelSectionLayout
      ref={scrollDivRef}
      sections={relationshipNames.map((relationshipName) => ({
        id: relationshipName,
        htmlId: `relationship-panel-${relationshipName}`,
        title: formatObjectField(relationshipName),
      }))}
      isPage={isPage}
      onSectionClick={({ id }) => setActiveRelationshipWrapper(id)}
    >
      <div className="relative">
        <AnimatePresence mode="popLayout">
          {filterWhenExpandedRelationship(
            orderedRelationships,
            activeRelationship,
          )?.map((relationship) => {
            const objectTypeDefaultConfig =
              objectTypeRelationshipConfig?.[relationship.name] || null;

            return (
              <PanelRelationshipSection
                key={relationship.name}
                relationship={relationship}
                objectTypeDefaultConfig={objectTypeDefaultConfig}
                modifiedConfig={
                  modifiedRelationships?.[relationship.name]?.config
                }
                inEditMode={inEditMode}
                isFetchingMoreRelationships={isFetchingMoreRelationships}
                newUids={getNewUidsForRelationship(
                  relationship.name,
                  modifiedRelationships,
                )}
                fetchMoreRelationships={fetchNextPage}
                hasMoreRelationships={relationshipsWithNextPage.includes(
                  relationship.name,
                )}
                setExpandedRelationship={setActiveRelationshipWrapper}
                isExpanded={!!activeRelationship}
                setPanelObject={setPanelObject}
                removeRelationshipObject={({ relationshipName, uid }) => {
                  modifyRelationshipObjects(relationshipName, {
                    removed: [uid],
                  });
                }}
                updateRelationshipConfig={(
                  updatedConfig: Partial<ParsedSkylarkRelationshipConfig>,
                ) => modifyRelationshipConfig(relationship.name, updatedConfig)}
                setSearchObjectsModalState={setSearchObjectsModalState}
              />
            );
          })}

          {!activeRelationship &&
            orderedRelationships.length > 0 &&
            emptyOrderedRelationships.length > 0 && (
              <PanelSeparator className="mb-8" />
            )}

          {filterWhenExpandedRelationship(
            emptyOrderedRelationships,
            activeRelationship,
          )?.map((relationship) => {
            const objectTypeDefaultConfig =
              objectTypeRelationshipConfig?.[relationship.name] || null;

            return (
              <PanelRelationshipSection
                isEmptySection
                setExpandedRelationship={setActiveRelationshipWrapper}
                isExpanded={!!activeRelationship}
                key={relationship.name}
                relationship={relationship}
                objectTypeDefaultConfig={objectTypeDefaultConfig}
                modifiedConfig={
                  modifiedRelationships?.[relationship.name]?.config
                }
                inEditMode={inEditMode}
                isFetchingMoreRelationships={isFetchingMoreRelationships}
                newUids={getNewUidsForRelationship(
                  relationship.name,
                  modifiedRelationships,
                )}
                setPanelObject={setPanelObject}
                removeRelationshipObject={({ relationshipName, uid }) => {
                  modifyRelationshipObjects(relationshipName, {
                    removed: [uid],
                  });
                }}
                updateRelationshipConfig={(
                  updatedConfig: Partial<ParsedSkylarkRelationshipConfig>,
                ) => modifyRelationshipConfig(relationship.name, updatedConfig)}
                setSearchObjectsModalState={setSearchObjectsModalState}
              />
            );
          })}
        </AnimatePresence>
      </div>
      <PanelLoading isLoading={isLoading}>
        {Array.from({ length: 2 }, (_, i) => (
          <div key={`content-of-skeleton-${i}`} className="mb-8">
            <Skeleton className="mb-4 h-6 w-52" />
            {Array.from({ length: 3 }, (_, j) => (
              <Skeleton
                key={`content-of-skeleton-inner-${i}-${j}`}
                className="mb-2 h-11 w-full max-w-xl"
              />
            ))}
          </div>
        ))}
      </PanelLoading>
      <DisplayGraphQLQuery
        label="Get Object Relationships"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
      {relationships && searchObjectsModalState && (
        <SearchObjectsModal
          title={`Add ${sentenceCase(
            formatObjectField(searchObjectsModalState.relationship.name) ||
              "Relationships",
          )}`}
          isOpen={!!searchObjectsModalState}
          objectTypes={
            searchObjectsModalState
              ? [searchObjectsModalState?.relationship.objectType]
              : undefined
          }
          columns={
            searchObjectsModalState?.fields
              ? [
                  OBJECT_LIST_TABLE.columnIds.displayField,
                  ...searchObjectsModalState?.fields,
                ]
              : undefined
          }
          existingObjects={searchObjectsModalState.relationship.objects}
          closeModal={() => setSearchObjectsModalState(null)}
          onSave={({ checkedObjectsState }) => {
            const { addedObjects, errors } = handleDroppedRelationships({
              droppedObjects: checkedObjectsState
                .filter(({ checkedState }) => checkedState === true)
                .map(({ object }) => object),
              activeObjectUid: uid,
              existingObjects: relationships,
              objectMetaRelationships,
              targetRelationship: searchObjectsModalState.relationship.name,
            });

            setModifiedRelationships(
              updateModifiedObjectsWithAddedObjects(
                modifiedRelationships,
                addedObjects,
              ),
              errors,
            );
          }}
        />
      )}
      {inEditMode && !isPage && (
        <p className="w-full py-4 text-center text-sm text-manatee-600">
          {"Drag an object from the Content Library to add as relationship"}
        </p>
      )}
    </PanelSectionLayout>
  );
};
