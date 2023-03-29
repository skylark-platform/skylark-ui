import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-toastify";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { Toast } from "src/components/toast/toast.component";
import { DROPPABLE_RELATIONSHIPS_ID } from "src/constants/skylark";
import { useGetObjectRelationships } from "src/hooks/useGetObjectRelationships";
import {
  ParsedSkylarkObject,
  SkylarkObjectRelationship,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface PanelRelationshipsProps {
  objectType: SkylarkObjectType;
  uid: string;
  showDropArea?: boolean;
  newRelationships: ParsedSkylarkObject[];
}

const parse = (
  objects: ParsedSkylarkObject[],
  relationships: SkylarkObjectRelationship[],
): { [k: string]: ParsedSkylarkObject[] } => {
  return objects.reduce((acc: { [k: string]: ParsedSkylarkObject[] }, cv) => {
    console.log("relationships", relationships, cv.objectType);
    const key = relationships.find(
      (relationship) => relationship.objectType === cv.objectType,
    )?.relationshipName;
    console.log("sdas", key);

    if (key) {
      const current = acc[key] || [];
      return { ...acc, [key]: [...current, cv] };
    } else {
      toast(
        <Toast
          title={`Error`}
          message={`Can't add ${cv.objectType} to this object relationship`}
          type="error"
        />,
      );
    }
    return acc;
  }, {});
};

export const PanelRelationships = ({
  objectType,
  uid,
  showDropArea,
  newRelationships,
}: PanelRelationshipsProps) => {
  const { data: relationshipsData, relationships = [] } =
    useGetObjectRelationships(objectType, uid);
  const [expandedRelationships, setExpandedRelationships] = useState<
    Record<string, boolean>
  >({});
  const { isOver, setNodeRef } = useDroppable({
    id: DROPPABLE_RELATIONSHIPS_ID,
  });

  console.log("nr", newRelationships);
  const nr = parse(newRelationships, relationships);
  console.log("nr parsed", nr);

  if (showDropArea)
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          isOver && "border-primary text-primary",
          "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-manatee-400",
        )}
      >
        <span>{`Drop object here to add to the ${objectType}'s content`}</span>
      </div>
    );

  return (
    <div className="overflow-anywhere h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {relationshipsData &&
          relationshipsData.map((relationship) => {
            const { relationshipName, objects } = relationship;
            const isExpanded = expandedRelationships[relationshipName];

            const displayList =
              objects?.length > 2 && !isExpanded
                ? objects.slice(0, 3)
                : objects;

            return (
              <div key={relationshipName} className="my-2">
                <div className="my-1 bg-manatee-100 p-4">
                  <h1>{formatObjectField(relationshipName)}</h1>
                </div>

                <div className="transition duration-300 ease-in-out">
                  <>
                    {nr[relationshipName]?.map((obj) => (
                      <ObjectIdentifierCard key={obj.uid} contentObject={obj} />
                    ))}
                    {relationship && displayList?.length > 0 ? (
                      displayList?.map((obj) => (
                        <ObjectIdentifierCard
                          key={obj.uid}
                          contentObject={obj}
                        />
                      ))
                    ) : (
                      <div className="m-5 text-sm italic text-manatee-500">
                        None
                      </div>
                    )}
                  </>
                </div>

                {relationship && objects.length > 3 && (
                  <div className="mt-2 border-t-[1px] pt-1 pb-3 text-center text-manatee-500">
                    <span
                      data-testid={`expand-relationship-${relationshipName}`}
                      onClick={() =>
                        setExpandedRelationships({
                          [relationshipName]: !isExpanded,
                        })
                      }
                      className="cursor-pointer text-xs italic"
                    >
                      {`Show ${isExpanded ? "less" : "more"}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
