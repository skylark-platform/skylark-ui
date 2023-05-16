import { ReactNode } from "react";

import { OpenObjectButton } from "src/components/button";
import { Pill } from "src/components/pill";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark/parsedObjects";
import { getObjectDisplayName } from "src/lib/utils";

interface ObjectIdentifierCardProps {
  object: ParsedSkylarkObject;
  children?: ReactNode;
  onForwardClick?: (o: SkylarkObjectIdentifier) => void;
  disableForwardClick?: boolean;
}

export const ObjectIdentifierCard = ({
  object,
  children,
  disableForwardClick,
  onForwardClick,
}: ObjectIdentifierCardProps) => {
  return (
    <div className="flex w-full flex-grow items-center space-x-2 py-3">
      <Pill
        label={object.config?.objectTypeDisplayName || object.objectType}
        bgColor={object.config?.colour}
        className="w-20"
      />
      <p className="flex flex-grow text-sm">{getObjectDisplayName(object)}</p>
      {children}
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
