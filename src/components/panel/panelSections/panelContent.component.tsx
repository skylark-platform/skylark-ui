import clsx from "clsx";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { HandleDropError } from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { useGetObjectContent } from "src/hooks/objects/get/useGetObjectContent";
import {
  ParsedSkylarkObjectContentObject,
  ModifiedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelContentProps extends SkylarkObjectIdentifier {
  isPage?: boolean;
  modifiedContentObjects: {
    objects: ModifiedSkylarkObjectContentObject[];
    removed: ParsedSkylarkObjectContentObject[];
  } | null;
  setContentObjects: (
    c: {
      objects: ModifiedSkylarkObjectContentObject[];
      removed: ParsedSkylarkObjectContentObject[];
    },
    errors: HandleDropError[],
  ) => void;
  inEditMode?: boolean;
  droppedObjects?: ParsedSkylarkObject[];
  showDropZone?: boolean;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

const mergeServerAndModifiedContent = (
  serverContentObjects: ParsedSkylarkObjectContentObject[] | undefined,
  modifiedContentObjects: PanelContentProps["modifiedContentObjects"],
) => {
  if (!serverContentObjects) {
    return [];
  }

  if (!modifiedContentObjects) {
    return serverContentObjects;
  }

  const removedUids = modifiedContentObjects.removed.map(
    ({ object }) => object.uid,
  );

  const parsedModifiedContentObjects = modifiedContentObjects.objects.filter(
    ({ object }) => !removedUids.includes(object.uid),
  );
  return parsedModifiedContentObjects;
};

export const PanelContentItemOrderInput = ({
  hasMoved,
  isNewObject,
  position,
  disabled,
  maxPosition,
  onBlur,
}: {
  hasMoved: boolean;
  isNewObject?: boolean;
  position: number;
  disabled: boolean;
  maxPosition: number;
  onBlur: (n: number) => void;
}) => {
  const [value, setValue] = useState<number | "">(position);

  useEffect(() => {
    setValue(position);
  }, [position]);

  const onChange = (newValue: string) => {
    if (newValue === "") {
      setValue("");
      return;
    }
    const int = parseInt(newValue);
    if (!Number.isNaN(int)) setValue(int);
  };

  const onBlurWrapper = () => {
    if (value === "") {
      onBlur(position);
    } else if (value >= 1 && value <= maxPosition) {
      onBlur(value);
    } else {
      // If the value is less than 0 or more than the maximum allowed position, normalise it
      const minMaxedValue = value < 1 ? 1 : maxPosition;
      onBlur(minMaxedValue);
      setValue(minMaxedValue);
    }
  };

  return (
    <input
      type="text"
      disabled={disabled}
      size={value.toString().length || 1}
      style={{
        // Safari darkens the text on a disabled input
        WebkitTextFillColor: "#fff",
      }}
      className={clsx(
        "flex h-6 min-w-6 items-center justify-center rounded-full px-1 pb-0.5 text-center transition-colors",
        !isNewObject &&
          (!hasMoved || disabled) &&
          "bg-brand-primary text-white",
        !isNewObject && hasMoved && "bg-warning text-warning-content",
        isNewObject && "bg-success",
      )}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlurWrapper}
      value={value}
    />
  );
};

export const PanelContent = ({
  isPage,
  modifiedContentObjects,
  inEditMode,
  showDropZone,
  objectType,
  uid,
  language,
  setContentObjects,
  setPanelObject,
}: PanelContentProps) => {
  const { data, isLoading, hasNextPage } = useGetObjectContent(
    objectType,
    uid,
    { language },
  );

  const objects = mergeServerAndModifiedContent(data, modifiedContentObjects);

  const onReorder = (updated: ModifiedSkylarkObjectContentObject[]) =>
    setContentObjects(
      {
        objects: updated,
        removed: modifiedContentObjects?.removed || [],
      },
      [],
    );

  const removeItem = (uid: string) => {
    if (objects) {
      const filtered = objects.filter(({ object }) => uid !== object.uid);
      onReorder(filtered);
    }
  };

  const handleManualOrderChange = (
    currentIndex: number,
    updatedPosition: number,
  ) => {
    if (objects) {
      const updatedIndex = updatedPosition - 1;
      const realUpdatedIndex =
        updatedIndex <= 0
          ? 0
          : updatedIndex >= objects.length
          ? objects.length - 1
          : updatedIndex;
      const updatedObjects = [...objects];

      const objToMove = updatedObjects.splice(currentIndex, 1)[0];
      updatedObjects.splice(realUpdatedIndex, 0, objToMove);

      onReorder(updatedObjects);
    }
  };

  if (showDropZone) {
    return <PanelDropZone />;
  }

  return (
    <PanelSectionLayout
      sections={[{ id: "content-panel-title", title: "Content" }]}
      isPage={isPage}
    >
      <PanelSectionTitle text="Content" id="content-panel-title" />
      {objects && (
        <Reorder.Group
          axis="y"
          values={objects}
          onReorder={onReorder}
          data-testid="panel-content-items"
          className="flex-grow"
        >
          {!isLoading && objects && objects?.length === 0 && (
            <PanelEmptyDataText />
          )}
          {objects.map((item, index) => {
            const { object, config, meta, position } = item;
            const isNewObject = hasProperty(item, "isNewObject");

            return (
              <Reorder.Item
                key={`panel-${uid}-content-item-${object.uid}`}
                value={item}
                data-testid={`panel-object-content-item-${index + 1}`}
                data-cy={"panel-object-content-item"}
                className={clsx(
                  "my-0 flex flex-col items-center justify-center",
                  inEditMode && "cursor-pointer",
                )}
                dragListener={inEditMode}
              >
                <ObjectIdentifierCard
                  object={
                    {
                      objectType: object.__typename,
                      uid: object.uid,
                      metadata: object,
                      config,
                      meta,
                    } as ParsedSkylarkObject
                  }
                  onForwardClick={setPanelObject}
                  disableForwardClick={inEditMode}
                  disableDeleteClick={!inEditMode}
                  onDeleteClick={() => removeItem(object.uid)}
                >
                  <div className="flex">
                    {inEditMode && (
                      <span
                        className={clsx(
                          "flex h-6 items-center justify-center px-0.5 text-manatee-400 transition-opacity",
                          position === index + 1 || isNewObject
                            ? "opacity-0"
                            : "opacity-100",
                        )}
                      >
                        {position}
                      </span>
                    )}
                    <PanelContentItemOrderInput
                      disabled={!inEditMode}
                      position={index + 1}
                      hasMoved={!!inEditMode && position !== index + 1}
                      isNewObject={inEditMode && isNewObject}
                      onBlur={(updatedPosition: number) =>
                        handleManualOrderChange(index, updatedPosition)
                      }
                      maxPosition={objects.length}
                    />
                  </div>
                </ObjectIdentifierCard>
                {index < objects.length - 1 && (
                  <PanelSeparator transparent={inEditMode} />
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}
      <PanelLoading isLoading={isLoading || hasNextPage}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton
            key={`content-skeleton-${i}`}
            className="mb-2 h-11 w-full max-w-xl"
          />
        ))}
      </PanelLoading>
      {inEditMode && !isPage && (
        <p className="w-full py-4 text-center text-sm text-manatee-600">
          {"Drag an object from the Content Library to add as content"}
        </p>
      )}
    </PanelSectionLayout>
  );
};
