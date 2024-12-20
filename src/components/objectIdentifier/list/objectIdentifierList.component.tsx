import clsx from "clsx";
import { useCallback, useRef } from "react";
import { useVirtual } from "react-virtual";

import {
  ObjectIdentifierCard,
  ObjectIdentifierCardProps,
} from "src/components/objectIdentifier/card/objectIdentifierCard.component";
import { SetPanelObject } from "src/hooks/state";
import { SkylarkObject } from "src/interfaces/skylark";

type ObjectIdentifierListProps = {
  objects: SkylarkObject[];
  className?: string;
  setPanelObject?: SetPanelObject;
  onDeleteClick?: (o: SkylarkObject) => void;
} & Omit<ObjectIdentifierCardProps, "object" | "onForwardClick">;

export const ObjectIdentifierList = ({
  objects,
  className,
  setPanelObject,
  ...props
}: ObjectIdentifierListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    parentRef,
    size: objects.length,
    estimateSize: useCallback(() => 48, []),
    overscan: 0,
  });

  return (
    <div
      ref={parentRef}
      // style={{ height: 600 }}
      className={clsx("w-full flex-grow h-full overflow-scroll", className)}
    >
      <div
        className="w-full relative"
        style={{
          height: `${rowVirtualizer.totalSize}px`,
        }}
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => {
          const object = objects[virtualRow.index];

          return (
            <div
              key={object.uid}
              className="top-0 left-0 w-full absolute"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ObjectIdentifierCard
                object={object}
                onForwardClick={setPanelObject}
                {...props}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
