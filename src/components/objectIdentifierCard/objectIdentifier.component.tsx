import { Pill } from "src/components/pill";
import { ParsedSkylarkObject } from "src/interfaces/skylark/parsedObjects";
import { getPrimaryKey } from "src/lib/utils";

interface ObjectIdentifierCardProps {
  contentObject: ParsedSkylarkObject;
}

export const ObjectIdentifierCard = ({
  contentObject,
}: ObjectIdentifierCardProps) => {
  const primaryKey = contentObject && getPrimaryKey(contentObject);
  return (
    <>
      <Pill
        label={contentObject.metadata.__typename as string}
        bgColor={contentObject.config.colour}
        className="w-20"
      />
      <div className="flex flex-1 text-sm">
        <p>
          {primaryKey ? contentObject.metadata[primaryKey] : contentObject.uid}
        </p>
      </div>
    </>
  );
};
