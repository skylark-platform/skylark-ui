import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Panel } from "src/components/panel";
import {
  PanelTab,
  PanelTabState,
  defaultPanelTabState,
  mergedPanelTabStates,
} from "src/hooks/state";
import { SkylarkObject } from "src/interfaces/skylark";
import { Active, DragStartEvent, DragType } from "src/lib/dndkit/dndkit";
import { createDefaultSkylarkObject } from "src/lib/skylark/objects";

const Object = () => {
  const router = useRouter();
  const { objectType, uid, language } = router.query;

  const [tab, setTab] = useState<PanelTab>(PanelTab.Metadata);

  const [tabState, setTabState] = useState<PanelTabState>(defaultPanelTabState);

  const object = useMemo(
    () =>
      objectType && uid
        ? createDefaultSkylarkObject({
            uid: uid as string,
            objectType: objectType as string,
            language: (language as string) || "",
          })
        : null,
    [language, objectType, uid],
  );

  const setPanelObject = ({ uid, objectType, language }: SkylarkObject) => {
    router.push({
      pathname: "/object/[objectType]/[uid]",
      query: { uid, objectType, language },
    });
    setTab(PanelTab.Metadata);
  };

  const [activeDragged, setActiveDragged] = useState<Active | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="pt-nav flex w-full h-full">
      <Head>
        <title>{`Skylark | ${objectType || "Object"} ${uid || ""} ${
          language ? `(${language})` : ""
        }`}</title>
      </Head>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragEnd}
        collisionDetection={closestCenter}
        sensors={sensors}
      >
        {object && (
          <div
            className="relative mx-auto w-full"
            style={{
              maxHeight: `calc(100vh - 4rem)`,
            }}
          >
            <Panel
              isPage
              object={object}
              tab={tab}
              tabState={tabState}
              setPanelObject={setPanelObject}
              setTab={setTab}
              updateActivePanelTabState={(newTabState) =>
                setTabState((prevTabState) =>
                  mergedPanelTabStates(prevTabState, newTabState),
                )
              }
            />
            {typeof window !== "undefined" && document?.body && (
              <>
                {createPortal(
                  <DragOverlay zIndex={99999999} dropAnimation={null}>
                    {activeDragged?.data?.current?.options?.dragOverlay ? (
                      <>{activeDragged.data.current.options.dragOverlay}</>
                    ) : null}
                  </DragOverlay>,
                  document.body,
                )}
              </>
            )}
          </div>
        )}
      </DndContext>
    </div>
  );

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current.type;

    if (type === DragType.PANEL_CONTENT_REORDER_OBJECTS) {
      setActiveDragged(event.active);
    }
  }

  function handleDragEnd() {
    if (activeDragged) setActiveDragged(null);
  }
};

export default Object;
