import clsx from "clsx";
import { ReactNode } from "react";

import { OpenObjectButton } from "src/components/button";
import { Trash } from "src/components/icons";
import { ObjectTypePill } from "src/components/pill";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
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
        "flex w-full flex-grow items-center space-x-2 py-3",
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
          <Trash
            className={clsx(
              "flex h-6 text-manatee-500 transition-all hover:text-error",
              !disableDeleteClick ? "w-6" : "w-0",
            )}
          />
        </button>
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
