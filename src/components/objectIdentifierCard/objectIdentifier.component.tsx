import { Pill } from "src/components/pill";
import { ParsedSkylarkObject } from "src/interfaces/skylark/parsedObjects";
import { getObjectDisplayName } from "src/lib/utils";

interface ObjectIdentifierCardProps {
  contentObject: ParsedSkylarkObject;
}

export const ObjectIdentifierCard = ({
  contentObject,
}: ObjectIdentifierCardProps) => {
  return (
    <>
      <Pill
        label={contentObject.objectType as string}
        bgColor={contentObject.config.colour}
        className="w-20"
      />
      <div className="flex flex-1 text-sm">
        <p>{getObjectDisplayName(contentObject)}</p>
      </div>
    </>
  );
};
