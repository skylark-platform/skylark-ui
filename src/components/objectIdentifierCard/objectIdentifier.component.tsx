import { ReactNode } from "react";

import { Pill } from "src/components/pill";
import { ParsedSkylarkObject } from "src/interfaces/skylark/parsedObjects";
import { getObjectDisplayName } from "src/lib/utils";

interface ObjectIdentifierCardProps {
  object: ParsedSkylarkObject;
  children?: ReactNode;
}

export const ObjectIdentifierCard = ({
  object,
  children,
}: ObjectIdentifierCardProps) => {
  return (
    <div className="flex w-full flex-grow items-center space-x-2 py-3">
      <Pill
        label={object.objectType}
        bgColor={object.config.colour}
        className="w-20"
      />
      <p className="flex flex-grow text-sm">{getObjectDisplayName(object)}</p>
      {children}
    </div>
  );
};
