import clsx from "clsx";
import { ReactNode } from "react";
import { FiTrash2, FiX } from "react-icons/fi";

import { AvailabilityIcon } from "src/components/availability";
import { OpenObjectButton } from "src/components/button";
import { Pill } from "src/components/pill";
import { PanelTab, SetPanelObject } from "src/hooks/state";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject } from "src/interfaces/skylark/parsedObjects";
import {
  getObjectDisplayName,
  isAvailabilityOrAvailabilitySegment,
  platformMetaKeyClicked,
} from "src/lib/utils";

interface ObjectIdentifierCardProps {
  object: ParsedSkylarkObject;
  children?: ReactNode;
  disableForwardClick?: boolean;
  disableDeleteClick?: boolean;
  deleteIconVariant?: "trash" | "x";
  hideObjectType?: boolean;
  className?: string;
  hideAvailabilityStatus?: boolean;
  forceConfigFromObject?: boolean;
  onForwardClick?: SetPanelObject;
  onDeleteClick?: () => void;
}

export const ObjectIdentifierCard = ({
  object,
  children,
  disableForwardClick,
  disableDeleteClick,
  hideObjectType,
  className,
  deleteIconVariant = "trash",
  hideAvailabilityStatus,
  forceConfigFromObject,
  onForwardClick,
  onDeleteClick,
}: ObjectIdentifierCardProps) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { config } = forceConfigFromObject
    ? { config: object.config }
    : objectTypesWithConfig?.find(
        ({ objectType }) => objectType === object.objectType,
      ) || { config: object.config };

  return (
    <div
      className={clsx(
        "flex w-full flex-grow items-center space-x-1.5 py-3",
        className,
      )}
    >
      {!hideObjectType && (
        <Pill
          label={config?.objectTypeDisplayName || object.objectType}
          bgColor={config?.colour || undefined}
          className="w-20 min-w-20 max-w-20"
        />
      )}
      <p className="flex flex-grow overflow-hidden whitespace-nowrap text-sm">
        <span className="overflow-hidden text-ellipsis">
          {getObjectDisplayName({ ...object, config })}
        </span>
      </p>
      {children}
      {!hideAvailabilityStatus &&
        !isAvailabilityOrAvailabilitySegment(object.objectType) && (
          <button
            onClick={
              onForwardClick &&
              (() =>
                onForwardClick(
                  {
                    uid: object.uid,
                    objectType: object.objectType,
                    language: object?.meta?.language || "",
                  },
                  { tab: PanelTab.Availability },
                ))
            }
            aria-label="Open Object (Availability tab)"
          >
            <AvailabilityIcon
              status={
                (object.availability && object.availability.status) || null
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
            !disableDeleteClick ? "w-6 pl-1" : "w-0",
          )}
          onClick={onDeleteClick}
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
                  object?.meta?.language || ""
                }`,
                "_blank",
              );
              return;
            } else {
              onForwardClick({
                uid: object.uid,
                objectType: object.objectType,
                language: object?.meta?.language || "",
              });
            }
          }}
        />
      )}
    </div>
  );
};
