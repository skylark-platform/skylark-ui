import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";

import { Trash } from "src/components/icons";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { DROPPABLE_ID } from "src/constants/skylark";
import {
  ParsedSkylarkObjectContentObject,
  AddedSkylarkObjectContentObject,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelContentProps {
  isPage?: boolean;
  objects: AddedSkylarkObjectContentObject[];
  objectType: string;
  onReorder: (objs: ParsedSkylarkObjectContentObject[]) => void;
  inEditMode?: boolean;
  showDropArea?: boolean;
}

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
        (!hasMoved || disabled) && "bg-brand-primary text-white",
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
  objects,
  inEditMode,
  objectType,
  onReorder,
  showDropArea,
}: PanelContentProps) => {
  const removeItem = (uid: string) => {
    const filtered = objects.filter(({ object }) => uid !== object.uid);
    onReorder(filtered);
  };
  const { isOver, setNodeRef } = useDroppable({
    id: DROPPABLE_ID,
  });

  const handleManualOrderChange = (
    currentIndex: number,
    updatedPosition: number,
  ) => {
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
  };

  if (showDropArea)
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          isOver && "border-primary text-primary",
          "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-manatee-400",
        )}
      >
        <span>{`Drop object here to add to the ${objectType}'s content`}</span>
      </div>
    );

  return (
    <PanelSectionLayout
      sections={[{ id: "content-panel-title", title: "Content" }]}
      isPage={isPage}
    >
      {/* TODO before deleting check on a set with content */}
      {/* <div className="flex h-full flex-col overflow-y-auto p-4 pt-6 text-sm md:p-8"> */}
      <PanelSectionTitle text="Content" id="content-panel-title" />
      <Reorder.Group
        axis="y"
        values={objects}
        onReorder={onReorder}
        data-testid="panel-content-items"
        className="flex-grow"
      >
        {objects?.length === 0 && <PanelEmptyDataText />}
        {objects.map((item, index) => {
          const { object, config, position, isNewObject } = item;

          return (
            <Reorder.Item
              key={`panel-content-item-${object.uid}`}
              value={item}
              data-testid={`panel-object-content-item-${index + 1}`}
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
                  } as ParsedSkylarkObject
                }
              >
                <div className="flex">
                  <span
                    className={clsx(
                      "flex h-6 min-w-6 items-center justify-center px-0.5 text-manatee-400 transition-opacity",
                      !inEditMode || position === index + 1 || isNewObject
                        ? "opacity-0"
                        : "opacity-100",
                    )}
                  >
                    {position}
                  </span>
                  <PanelContentItemOrderInput
                    disabled={!inEditMode}
                    position={index + 1}
                    hasMoved={position !== index + 1}
                    isNewObject={isNewObject}
                    onBlur={(updatedPosition: number) =>
                      handleManualOrderChange(index, updatedPosition)
                    }
                    maxPosition={objects.length}
                  />
                  <button
                    disabled={!inEditMode}
                    data-testid={`panel-object-content-item-${
                      index + 1
                    }-remove`}
                    onClick={() => removeItem(object.uid)}
                  >
                    <Trash
                      className={clsx(
                        "ml-2 flex h-6 w-6 text-manatee-300 transition-all hover:text-error",
                        inEditMode ? "w-6" : "w-0",
                      )}
                    />
                  </button>
                </div>
              </ObjectIdentifierCard>
              {index < objects.length - 1 && (
                <PanelSeparator transparent={inEditMode} />
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {inEditMode && (
        <p className="w-full py-4 text-center text-sm text-manatee-600">
          {`Drag an object from the Content Library to add to this ${objectType}'s content`}
        </p>
      )}
      {/* </div> */}
    </PanelSectionLayout>
  );
};
