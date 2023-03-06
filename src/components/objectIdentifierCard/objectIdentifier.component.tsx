import { ParsedSkylarkObjectContentObject } from "src/interfaces/skylark/parsedObjects";
import { getPrimaryKey } from "src/lib/utils";

import { Pill } from "../pill";

interface ObjectIdentifierCardProps {
  contentObject: ParsedSkylarkObjectContentObject;
}

export const ObjectIdentifierCard = ({
  contentObject,
}: ObjectIdentifierCardProps) => {
  const primaryKey = contentObject && getPrimaryKey(contentObject);
  const { object } = contentObject;
  return (
    <>
      <Pill
        label={object.__typename as string}
        bgColor={contentObject.config.colour}
        className="w-20"
      />
      <div className="flex flex-1 text-sm">
        <p>{primaryKey ? object[primaryKey] : object.uid}</p>
      </div>
    </>
  );
};
