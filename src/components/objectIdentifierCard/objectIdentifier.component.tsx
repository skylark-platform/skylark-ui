import { ParsedSkylarkObjectMetadata } from "src/interfaces/skylark/parsedObjects";

import { Pill } from "../pill";

interface ObjectIdentifierCardProps {
  object: ParsedSkylarkObjectMetadata;
  colour: string | undefined;
  primaryKey: string | undefined;
}

export const ObjectIdentifierCard = ({
  object,
  colour,
  primaryKey,
}: ObjectIdentifierCardProps) => {
  return (
    <>
      <Pill
        label={object.__typename as string}
        bgColor={colour}
        className="w-20"
      />
      <div className="flex flex-1 text-sm">
        <p>{primaryKey ? object[primaryKey] : object.uid}</p>
      </div>
    </>
  );
};
