import clsx from "clsx";
import { Reorder } from "framer-motion";
import { useState } from "react";

import { Pill } from "src/components/pill";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { ParsedSkylarkObjectContent } from "src/interfaces/skylark";

interface PanelContentProps {
  objects: ParsedSkylarkObjectContent["objects"];
  onReorder: (objs: ParsedSkylarkObjectContent["objects"]) => void;
  inEditMode?: boolean;
}

export const PanelContent = ({
  objects,
  inEditMode,
  onReorder,
}: PanelContentProps) => {
  // const [contentObjects, setContentObjects] = useState(objects);

  // const onReorder = (newOrder: ParsedSkylarkObjectContent["objects"]) => {
  //   setContentObjects(newOrder);
  //   onChange(newOrder);
  // };

  return (
    <div className="h-full overflow-y-scroll p-4 text-sm md:p-8">
      <Reorder.Group
        axis="y"
        values={objects}
        onReorder={onReorder}
        as="div"
        className="mt-4"
      >
        {objects.map((item, index) => {
          const { object, config, position } = item;

          const primaryKey = [
            config.primaryField || "",
            ...DISPLAY_NAME_PRIORITY,
          ].find((field) => !!object[field]);
          return (
            <Reorder.Item
              key={`content-item-${object.uid}`}
              value={item}
              className={clsx(
                "my-0 flex flex-row-reverse items-center justify-center gap-2 border-b px-2 py-3 text-sm last:border-b-0 md:gap-4 md:px-4",
                inEditMode && "cursor-pointer",
              )}
              as="div"
              dragListener={inEditMode}
            >
              <div className="flex">
                <span
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center text-manatee-400 transition-opacity",
                    position === index + 1 ? "opacity-0" : "opacity-100",
                  )}
                >
                  {position}
                </span>
                <span
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                    position === index + 1
                      ? "bg-brand-primary text-white"
                      : "bg-warning text-warning-content",
                  )}
                >
                  {index + 1}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex gap-1">
                  <p>{primaryKey ? object[primaryKey] : object.uid}</p>
                  <p></p>
                </div>
              </div>
              <Pill
                label={object.__typename as string}
                bgColor={config.colour}
                className="w-20"
              />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
};
