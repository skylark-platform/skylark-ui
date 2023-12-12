import { useEffect, useMemo, useState } from "react";
import { sentenceCase } from "sentence-case";

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
import { useGetObjectRelationships } from "src/hooks/objects/get/useGetObjectRelationships";
import { PanelTab, PanelTabState } from "src/hooks/state";
import { useObjectTypeRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
import {
  ParsedSkylarkObjectRelationships,
  SkylarkObjectType,
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  ParsedSkylarkObjectRelationship,
} from "src/interfaces/skylark";
import { formatObjectField, hasProperty } from "src/lib/utils";

import { PanelRelationshipSection } from "./panelRelationshipsSection.component";
import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  tabState: PanelTabState[PanelTab.Relationships];
  modifiedRelationships: Record<
    string,
    { added: ParsedSkylarkObject[]; removed: string[] }
  >;
  setModifiedRelationships: (
    rels: Record<string, { added: ParsedSkylarkObject[]; removed: string[] }>,
    errors: HandleDropError[],
  ) => void;
  inEditMode: boolean;
  showDropZone?: boolean;
  droppedObjects?: ParsedSkylarkObject[];
  language: string;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  updateActivePanelTabState: (s: Partial<PanelTabState>) => void;
}

const sortByRelationshipName = (
  relationshipNames: string[],
  arr: ParsedSkylarkObjectRelationship[] | null,
) =>
  arr?.sort(
    (a, b) =>
      relationshipNames.indexOf(a.name) - relationshipNames.indexOf(b.name),
  ) || [];

const splitRelationshipsIntoSections = (
  relationshipNames: string[],
  relationships: ParsedSkylarkObjectRelationships | null,
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
      orderedRelationships: ParsedSkylarkObjectRelationship[];
      emptyOrderedRelationships: ParsedSkylarkObjectRelationship[];
    },
  );

const addModifiedRelationshipsOntoRelationships = (
  relationships: ParsedSkylarkObjectRelationships | null,
  modifiedRelationships: PanelRelationshipsProps["modifiedRelationships"],
): ParsedSkylarkObjectRelationships | null => {
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
  addedObjects: Record<string, ParsedSkylarkObject[]>,
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
  existing: { added: ParsedSkylarkObject[]; removed: string[] },
  added: ParsedSkylarkObject[],
  removed: string[],
) => {
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
  droppedObjects,
  showDropZone,
  tabState,
  setPanelObject,
  updateActivePanelTabState,
}: PanelRelationshipsProps) => {
  const {
    relationships: serverRelationships,
    objectRelationships: objectMetaRelationships = [],
    isLoading,
    query,
    variables,
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

  useEffect(() => {
    if (
      droppedObjects &&
      droppedObjects.length > 0 &&
      objectMetaRelationships &&
      relationships
    ) {
      const { addedObjects, errors } = handleDroppedRelationships({
        droppedObjects,
        activeObjectUid: uid,
        existingObjects: relationships,
        objectMetaRelationships,
      });

      setModifiedRelationships(
        updateModifiedObjectsWithAddedObjects(
          modifiedRelationships,
          addedObjects,
        ),
        errors,
      );
    }
  }, [
    droppedObjects,
    modifiedRelationships,
    objectMetaRelationships,
    relationships,
    setModifiedRelationships,
    uid,
  ]);

  const modifyRelationshipObjects = (
    relationshipName: string,
    { added, removed }: { added?: ParsedSkylarkObject[]; removed?: string[] },
  ) => {
    const relationship = hasProperty(modifiedRelationships, relationshipName)
      ? modifiedRelationships[relationshipName]
      : { added: [], removed: [] };

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

  const relationshipNames = objectMetaRelationships.map(
    ({ relationshipName }) => relationshipName,
  );

  const { orderedRelationships, emptyOrderedRelationships } =
    splitRelationshipsIntoSections(relationshipNames, relationships);

  const [searchObjectsModalState, setSearchObjectsModalState] = useState<{
    relationship: ParsedSkylarkObjectRelationship;
    fields?: string[];
  } | null>(null);

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
        {orderedRelationships?.map((relationship) => {
          const config =
            objectTypeRelationshipConfig?.[relationship.name] || null;

          return (
            <PanelRelationshipSection
              key={relationship.name}
              relationship={relationship}
              config={config}
              inEditMode={inEditMode}
              newUids={getNewUidsForRelationship(
                relationship.name,
                modifiedRelationships,
              )}
              initialExpanded={tabState.expanded?.[relationship.name]}
              setPanelObject={setPanelObject}
              removeRelationshipObject={({ relationshipName, uid }) => {
                modifyRelationshipObjects(relationshipName, { removed: [uid] });
              }}
              setSearchObjectsModalState={setSearchObjectsModalState}
              updateActivePanelTabState={updateActivePanelTabState}
            />
          );
        })}

        {orderedRelationships.length > 0 &&
          emptyOrderedRelationships.length > 0 && (
            <PanelSeparator className="my-8" />
          )}

        {emptyOrderedRelationships?.map((relationship) => {
          const config =
            objectTypeRelationshipConfig?.[relationship.name] || null;

          return (
            <PanelRelationshipSection
              isEmptySection
              key={relationship.name}
              relationship={relationship}
              config={config}
              inEditMode={inEditMode}
              initialExpanded={tabState.expanded?.[relationship.name]}
              newUids={getNewUidsForRelationship(
                relationship.name,
                modifiedRelationships,
              )}
              setPanelObject={setPanelObject}
              removeRelationshipObject={({ relationshipName, uid }) => {
                modifyRelationshipObjects(relationshipName, { removed: [uid] });
              }}
              setSearchObjectsModalState={setSearchObjectsModalState}
              updateActivePanelTabState={updateActivePanelTabState}
            />
          );
        })}
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
          onModalClose={({ checkedObjects }) => {
            const { addedObjects, errors } = handleDroppedRelationships({
              droppedObjects: checkedObjects,
              activeObjectUid: uid,
              existingObjects: relationships,
              objectMetaRelationships,
              relationshipName: searchObjectsModalState.relationship.name,
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
