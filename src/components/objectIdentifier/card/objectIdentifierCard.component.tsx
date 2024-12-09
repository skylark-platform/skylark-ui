import clsx from "clsx";
import { ReactNode } from "react";
import { FiTrash2, FiX, FiZap } from "react-icons/fi";

import { AvailabilityIcon } from "src/components/availability";
import { OpenObjectButton } from "src/components/button";
import { Pill } from "src/components/pill";
import { PanelTab, SetPanelObject } from "src/hooks/state";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  SkylarkObject,
} from "src/interfaces/skylark/parsedObjects";
import {
  isAvailabilityOrAvailabilitySegment,
  platformMetaKeyClicked,
} from "src/lib/utils";

export interface ObjectIdentifierCardProps {
  object: SkylarkObject;
  objectConfig?: ParsedSkylarkObjectConfig;
  children?: ReactNode;
  disableForwardClick?: boolean;
  disableDeleteClick?: boolean;
  deleteIconVariant?: "trash" | "x";
  hideObjectType?: boolean;
  className?: string;
  hideAvailabilityStatus?: boolean;
  forceConfigFromObject?: boolean;
  showDragIcon?: boolean;
  onForwardClick?: SetPanelObject;
  onDeleteClick?: (o: SkylarkObject) => void;
}

export const ObjectIdentifierCard = ({
  object,
  objectConfig,
  children,
  disableForwardClick,
  disableDeleteClick,
  hideObjectType,
  className,
  deleteIconVariant = "trash",
  hideAvailabilityStatus,
  forceConfigFromObject,
  showDragIcon,
  onForwardClick,
  onDeleteClick,
}: ObjectIdentifierCardProps) => {
  const { objectTypesConfig } = useSkylarkObjectTypesWithConfig();

  const config = forceConfigFromObject
    ? objectConfig
    : objectTypesConfig?.[object.objectType] || objectConfig;

  return (
    <div
      className={clsx(
        "flex w-full flex-grow items-center space-x-1.5 py-3",
        className,
      )}
    >
      {showDragIcon && (
        <span className="-ml-4 block w-2.5 h-5 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat opacity-60" />
      )}
      {!hideObjectType && (
        <Pill
          Icon={object.hasDynamicContent ? FiZap : undefined}
          label={
            config?.objectTypeDisplayName ||
            object.display.objectType ||
            object.objectType
          }
          bgColor={object.display.colour || config?.colour || undefined}
          className="w-20 min-w-20 max-w-20"
        />
      )}
      <p className="flex flex-grow overflow-hidden whitespace-nowrap text-sm">
        <span className="overflow-hidden text-ellipsis">
          {object.display.name}
        </span>
      </p>
      {children}
      {!hideAvailabilityStatus &&
        !isAvailabilityOrAvailabilitySegment(object.objectType) && (
          <button
            onClick={
              onForwardClick &&
              (() => onForwardClick(object, { tab: PanelTab.Availability }))
            }
            aria-label="Open Object (Availability tab)"
          >
            <AvailabilityIcon
              status={
                // (object.availability && object.availability.status) || null
                object.availabilityStatus
              }
              className="text-xl"
              withTooltipDescription
            />
          </button>
        )}
      {onDeleteClick && (
        <button
          disabled={disableDeleteClick}
          data-testid="object-identifier-delete"
          className={clsx(
            "transition-width",
            !disableDeleteClick ? "w-5" : "w-0 !-mx-0",
          )}
          onClick={() => onDeleteClick(object)}
        >
          {deleteIconVariant === "trash" && (
            <FiTrash2
              className={clsx(
                "flex h-5 text-manatee-500 transition-all hover:text-error",
                !disableDeleteClick ? "w-5" : "w-0",
              )}
            />
          )}
          {deleteIconVariant === "x" && (
            <FiX
              className={clsx(
                "flex h-4 text-manatee-500 transition-all hover:text-error",
                !disableDeleteClick ? "w-4" : "w-0",
              )}
            />
          )}
        </button>
      )}
      {onForwardClick && (
        <OpenObjectButton
          disabled={disableForwardClick}
          onClick={(e) => {
            if (platformMetaKeyClicked(e)) {
              window.open(
                `/object/${object.objectType}/${object.uid}?language=${
                  object?.language || ""
                }`,
                "_blank",
              );
              return;
            } else {
              onForwardClick(object);
            }
          }}
        />
      )}
    </div>
  );
};
