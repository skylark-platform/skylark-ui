import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";

import { Trash } from "src/components/icons";
import { Pill } from "src/components/pill";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { ParsedSkylarkObjectContent } from "src/interfaces/skylark";

interface PanelContentProps {
  objects: ParsedSkylarkObjectContent["objects"];
  onReorder: (objs: ParsedSkylarkObjectContent["objects"]) => void;
  inEditMode?: boolean;
  activeId?: any;
}

export const PanelContentItemOrderInput = ({
  hasMoved,
  position,
  disabled,
  onBlur,
}: {
  hasMoved: boolean;
  position: number;
  disabled: boolean;
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

  return (
    <input
      type="text"
      disabled={disabled}
      size={value.toString().length || 1}
      className={clsx(
        "flex h-6 min-w-6 items-center justify-center rounded-full px-1 pb-0.5 text-center transition-colors",
        !hasMoved
          ? "bg-brand-primary text-white"
          : "bg-warning text-warning-content",
      )}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onBlur(value === "" ? position : value)}
      value={value}
    />
  );
};

export const PanelContent = ({
  objects,
  inEditMode,
  onReorder,
  activeId,
}: PanelContentProps) => {
  const removeItem = (uid: string) => {
    const filtered = objects.filter(({ object }) => uid !== object.uid);
    onReorder(filtered);
  };
  const { isOver, setNodeRef } = useDroppable({
    id: "droppable",
  });
  const style = {
    color: isOver ? "green" : undefined,
  };

  const handleManualOrderChange = (
    currentIndex: number,
    updatedIndex: number,
  ) => {
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

  if (activeId)
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="m-4 h-72 border-2 border-dotted text-center text-manatee-400"
      >
        <span className="content-center items-center justify-center">
          Drop in media to start curating or set dynamic controls
        </span>
      </div>
    );

  return (
    <Reorder.Group
      axis="y"
      values={objects}
      onReorder={onReorder}
      className="h-full overflow-y-auto p-4 text-sm md:p-8"
      data-testid="panel-content-items"
    >
      {objects.map((item, index) => {
        const { object, config, position } = item;

        const primaryKey = [
          config.primaryField || "",
          ...DISPLAY_NAME_PRIORITY,
        ].find((field) => !!object[field]);
        return (
          <Reorder.Item
            key={`panel-content-item-${object.uid}`}
            value={item}
            className={clsx(
              "my-0 flex items-center justify-center gap-2 border-b px-2 py-3 text-sm last:border-b-0 md:gap-4 md:px-4",
              inEditMode && "cursor-pointer",
            )}
            dragListener={inEditMode}
          >
            <Pill
              label={object.__typename as string}
              bgColor={config.colour}
              className="w-20"
            />
            <div className="flex flex-1">
              <p>{primaryKey ? object[primaryKey] : object.uid}</p>
            </div>
            <div className="flex">
              <span
                className={clsx(
                  "flex h-6 min-w-6 items-center justify-center px-0.5 text-manatee-400 transition-opacity",
                  position === index + 1 ? "opacity-0" : "opacity-100",
                )}
              >
                {position}
              </span>
              <PanelContentItemOrderInput
                disabled={!inEditMode}
                position={index + 1}
                hasMoved={position !== index + 1}
                onBlur={(updatedPosition: number) =>
                  handleManualOrderChange(index, updatedPosition - 1)
                }
              />
              <button
                disabled={!inEditMode}
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
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
};
