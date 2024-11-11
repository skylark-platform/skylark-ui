import { useDndContext, useDroppable } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiZap } from "react-icons/fi";

import { Button } from "src/components/button";
import {
  DisplayGraphQLQuery,
  DynamicContentConfigurationModal,
  SearchObjectsModal,
} from "src/components/modals";
import { SortableContentObjectList } from "src/components/objectIdentifier";
import {
  HandleDropError,
  handleDroppedContents,
} from "src/components/panel/panel.lib";
import {
  PanelButton,
  PanelEmptyDataText,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useGetObjectContent } from "src/hooks/objects/get/useGetObjectContent";
import { SetPanelObject } from "src/hooks/state";
import {
  SkylarkObjectContentObject,
  AddedSkylarkObjectContentObject,
} from "src/interfaces/skylark";
import { DroppableType } from "src/lib/dndkit/dndkit";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelContentProps {
  uid: string;
  objectType: string;
  language: string;
  isPage?: boolean;
  objects: AddedSkylarkObjectContentObject[] | null;
  setContentObjects: (
    contentObjects: {
      original: SkylarkObjectContentObject[] | null;
      updated: AddedSkylarkObjectContentObject[] | null;
    },
    errors: HandleDropError[],
  ) => void;
  inEditMode?: boolean;
  setPanelObject: SetPanelObject;
}

export const PanelContent = ({
  isPage,
  objects: updatedObjects,
  inEditMode,
  objectType,
  uid,
  language,
  setContentObjects,
  setPanelObject,
}: PanelContentProps) => {
  const { active: activeDragged } = useDndContext();
  const isDragging = useMemo(() => Boolean(activeDragged), [activeDragged]);

  const { data, isLoading, hasNextPage, isFetchingNextPage, query, variables } =
    useGetObjectContent(objectType, uid, {
      language,
      fetchAvailability: true,
    });

  const objects = (inEditMode ? updatedObjects : data) || [];

  useEffect(() => {
    if (!inEditMode && data) {
      setContentObjects(
        {
          original: data,
          updated: data,
        },
        [],
      );
    }
  }, [data, inEditMode, setContentObjects]);

  const onReorder = useCallback(
    (updated: AddedSkylarkObjectContentObject[], errors?: HandleDropError[]) =>
      setContentObjects(
        {
          original: data || null,
          updated,
        },
        errors || [],
      ),
    [data, setContentObjects],
  );

  const { setNodeRef } = useDroppable({
    id: DroppableType.PANEL_CONTENT_SORTABLE,
  });

  const [modalState, setModalState] = useState<
    false | "search" | "dynamic-content"
  >(false);

  return (
    <PanelSectionLayout
      sections={[
        { htmlId: "content-panel-title", title: "Content", id: "content" },
      ]}
      withoutPadding
      isPage={isPage}
      ref={setNodeRef}
    >
      <div className="flex items-center px-8 pt-8">
        <PanelSectionTitle
          text="Content"
          id="content-panel-title"
          count={objects.length || 0}
          loading={isLoading || isFetchingNextPage}
        />
        {!isFetchingNextPage && (
          <PanelButton
            aria-label={`Open edit content modal`}
            className="ml-1"
            type="plus"
            onClick={() => setModalState("search")}
          />
        )}
        <div className="flex flex-grow justify-end">
          <Button
            variant="link"
            className="-mt-4"
            onClick={() => setModalState("dynamic-content")}
            Icon={<FiZap className="text-base -mr-1" />}
          >
            Configure Dynamic Content
          </Button>
        </div>
      </div>

      <div className="">
        {/* <PanelButton
          aria-label={`Open content settings`}
          className="ml-1"
          type="settings"
          onClick={() => setModalState("dynamic-content")}
        /> */}

        {!isLoading &&
          objects.length === 0 &&
          ((inEditMode && !isPage) || isDragging ? (
            <p className="w-full text-left text-sm text-manatee-600 p-0.5">
              {
                "Drag & Drop an object from the Content Library here to add as content."
              }
            </p>
          ) : (
            <PanelEmptyDataText />
          ))}
        <SortableContentObjectList
          uid={uid}
          objects={objects}
          isDragging={isDragging}
          isLoading={isLoading}
          inEditMode={inEditMode}
          onReorder={onReorder}
          setPanelObject={setPanelObject}
        />
        <DisplayGraphQLQuery
          label="Get Object Content"
          query={query}
          variables={variables}
          buttonClassName="absolute right-2 top-0"
        />
        {/* <PanelLoading
        isLoading={
          (isLoading && objectType.length === 0) ||
          hasNextPage ||
          isFetchingNextPage
        }
      >
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton
            key={`content-skeleton-${i}`}
            className="mb-2 h-11 w-full max-w-xl"
          />
        ))}
      </PanelLoading> */}
      </div>
      <DynamicContentConfigurationModal
        isOpen={modalState === "dynamic-content"}
        uid={uid}
        objectType={objectType}
        closeModal={() => setModalState(false)}
      />
      <SearchObjectsModal
        title={`Add Content`}
        isOpen={modalState === "search"}
        // columns={
        //   searchObjectsModalState?.fields
        //     ? [
        //         OBJECT_LIST_TABLE.columnIds.displayField,
        //         ...searchObjectsModalState?.fields,
        //       ]
        //     : undefined
        // }
        existingObjects={objects}
        closeModal={() => setModalState(false)}
        onSave={({ checkedObjectsState }) => {
          const { updatedContentObjects, errors } = handleDroppedContents({
            droppedObjects: checkedObjectsState
              .filter(({ checkedState }) => checkedState === true)
              .map(({ object }) => object),
            activeObjectUid: uid,
            existingObjects: objects || [],
            indexToInsert: 0,
          });

          onReorder(updatedContentObjects, errors);
        }}
      />
    </PanelSectionLayout>
  );
};
