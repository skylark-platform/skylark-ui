import { useState } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { useGetObjectRelationships } from "src/hooks/useGetObjectRelationships";
import { SkylarkObjectType } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface PanelRelationshipsProps {
  objectType: SkylarkObjectType;
  uid: string;
}

export const PanelRelationships = ({
  objectType,
  uid,
}: PanelRelationshipsProps) => {
  const { data: relationships } = useGetObjectRelationships(objectType, uid);
  const [expandStatus, setExpandStatus] = useState<{
    [relation: string]: boolean;
  }>({});

  return (
    <div className="overflow-anywhere h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {relationships &&
          relationships.map((relationship) => {
            const { relationshipName, objects } = relationship;
            const isExpanded = expandStatus[relationshipName];

            const displayList =
              objects?.length > 2 && !isExpanded
                ? objects.slice(0, 3)
                : objects;

            return (
              <div key={relationshipName} className="my-2">
                <div className="mb-1 mt-5 bg-manatee-100 p-4">
                  <h1>{formatObjectField(relationshipName)}</h1>
                </div>

                <div className="transition duration-300 ease-in-out">
                  {relationship && displayList?.length > 0 ? (
                    displayList?.map((obj, index: number) => {
                      if (index > 2 && !isExpanded) {
                        return;
                      }
                      return (
                        <ObjectIdentifierCard
                          key={obj.uid}
                          contentObject={obj}
                        />
                      );
                    })
                  ) : (
                    <div className="m-5 text-sm italic text-manatee-500">
                      None
                    </div>
                  )}
                </div>

                {relationship && objects.length > 3 && (
                  <div className="mt-2 border-t-[1px] py-1 text-center text-manatee-500">
                    <span
                      onClick={() =>
                        setExpandStatus({
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
