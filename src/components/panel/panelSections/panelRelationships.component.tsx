import { useState } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { Pill } from "src/components/pill";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import {
  parseNEW,
  useObjectRelationships,
} from "src/hooks/useObjectRelationship";
import {
  ParsedSkylarkObject,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectRelationship,
  SkylarkObjectType,
} from "src/interfaces/skylark";

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

  console.log(data);
  // <ObjectIdentifierCard contentObject={obj} />

  return (
    <div className="overflow-anywhere h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {data &&
          Object.keys(data)?.map((relation) => {
            const relationship = data[
              relation
            ] as SkylarkGraphQLObjectRelationship;

            return (
              <div key={relation} className="my-2">
                <div className="mb-1 mt-3 bg-manatee-100 p-2 capitalize">
                  <h1>{relation}</h1>
                </div>

                <div className="transition duration-300 ease-in-out">
                  {relationship && relationship?.objects?.length > 0 ? (
                    relationship.objects?.map((obj: any, index: number) => {
                      if (index > 2 && !expandStatus[relation]) {
                        return;
                      }
                      const po = parseNEW(obj);
                      console.log({ po });
                      /*
                      const parsedObject: ParsedSkylarkObject = {
                        objectType: obj.__typename,
                        uid: obj.uid,
                        config: {
                          colour: obj._config?.colour,
                          primaryField: obj._config?.primary_field,
                        },
                        meta: {
                          availableLanguages: obj._meta?.available_languages,
                        },
                      };
*/

                      return (
                        <div key={obj.uid} className="m-1 flex space-x-2 ">
                          <ObjectIdentifierCard contentObject={po} />
                        </div>
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
                        setExpandStatus({ [relation]: !expandStatus[relation] })
                      }
                      className="cursor-pointer text-xs italic"
                    >
                      {`Show ${expandStatus[relation] ? "less" : "more"}`}
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
