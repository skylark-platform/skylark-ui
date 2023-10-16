import clsx from "clsx";
import { ReactNode } from "react";
import { FiTrash, FiTrash2 } from "react-icons/fi";

import { AvailabilityIcon } from "src/components/availability";
import { OpenObjectButton } from "src/components/button";
import { ObjectTypePill } from "src/components/pill";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark/parsedObjects";
import { getObjectDisplayName } from "src/lib/utils";

interface ObjectIdentifierCardProps {
  object: ParsedSkylarkObject;
  children?: ReactNode;
  disableForwardClick?: boolean;
  disableDeleteClick?: boolean;
  hideObjectType?: boolean;
  className?: string;
  hideAvailabilityStatus?: boolean;
  onForwardClick?: (o: SkylarkObjectIdentifier) => void;
  onDeleteClick?: () => void;
}

export const ObjectIdentifierCard = ({
  object,
  children,
  disableForwardClick,
  disableDeleteClick,
  hideObjectType,
  className,
  hideAvailabilityStatus,
  onForwardClick,
  onDeleteClick,
}: ObjectIdentifierCardProps) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { config } = objectTypesWithConfig?.find(
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
        <ObjectTypePill
          type={object.objectType}
          defaultConfig={object.config}
          className="w-20 min-w-20 max-w-20"
        />
      )}
      <p className="flex flex-grow overflow-hidden whitespace-nowrap text-sm">
        <span className="overflow-hidden text-ellipsis">
          {getObjectDisplayName({ ...object, config })}
        </span>
      </p>
      {children}
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
          <FiTrash2
            className={clsx(
              "flex h-5 text-manatee-500 transition-all hover:text-error",
              !disableDeleteClick ? "w-5" : "w-0",
            )}
          />
        </button>
      )}
      {!hideAvailabilityStatus &&
        object.objectType !== BuiltInSkylarkObjectType.Availability && (
          <div>
            <AvailabilityIcon
              availability={object.availability}
              className="text-xl"
              withTooltipDescription
            />
          </div>
        )}
      {onForwardClick && (
        <OpenObjectButton
          disabled={disableForwardClick}
          onClick={() =>
            onForwardClick({
              uid: object.uid,
              objectType: object.objectType,
              language: object?.meta?.language || "",
            })
          }
        />
      )}
    </div>
  );
};
