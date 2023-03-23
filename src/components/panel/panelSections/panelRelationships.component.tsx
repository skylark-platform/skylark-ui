import { useState } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { useObjectRelationships } from "src/hooks/useObjectRelationship";
import { SkylarkObjectType } from "src/interfaces/skylark";

interface PanelRelationshipsProps {
  objectType: SkylarkObjectType;
  uid: string;
}

export const PanelRelationships = ({
  objectType,
  uid,
}: PanelRelationshipsProps) => {
  const { data } = useObjectRelationships(objectType, uid);
  const [expandStatus, setExpandStatus] = useState<{
    [relation: string]: boolean;
  }>({});

  return (
    <div className="overflow-anywhere h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {data &&
          data.map((relationship) => {
            const { relationshipName, objects } = relationship;

            return (
              <div key={relationshipName} className="my-2">
                <div className="mb-1 mt-3 bg-manatee-100 p-2 capitalize">
                  <h1>{relationshipName}</h1>
                </div>

                <div className="transition duration-300 ease-in-out">
                  {relationship && objects?.length > 0 ? (
                    objects?.map((obj, index: number) => {
                      if (index > 2 && !expandStatus[relationshipName]) {
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
                    <span className="ml-2 text-sm italic text-manatee-500">
                      None
                    </span>
                  )}
                </div>

                {relationship && relationship?.objects.length > 3 && (
                  <div className="mt-2 border-t-[1px] py-1 text-center text-manatee-500">
                    <span
                      onClick={() =>
                        setExpandStatus({
                          [relationshipName]: !expandStatus[relationshipName],
                        })
                      }
                      className="cursor-pointer text-xs italic"
                    >
                      {`Show ${
                        expandStatus[relationshipName] ? "less" : "more"
                      }`}
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
