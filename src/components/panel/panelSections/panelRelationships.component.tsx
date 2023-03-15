import { Pill } from "src/components/pill";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { useObjectRelationships } from "src/hooks/useObjectRelationship";
import {
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

  console.log("party data ~~", data);
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

                {relationship && relationship?.objects?.length > 0 ? (
                  relationship.objects.map((obj) => {
                    const primaryKey = [
                      obj?._config?.primaryField || "",
                      ...DISPLAY_NAME_PRIORITY,
                    ].find((field) => !!obj[field]);
                    return (
                      <div key={obj.uid} className="m-1">
                        <Pill
                          label={obj?.__typename}
                          bgColor={obj?._config?.colour}
                          className="mr-2"
                        />
                        {obj[primaryKey]}
                      </div>
                    );
                  })
                ) : (
                  <span className="ml-2 text-sm italic text-manatee-500">
                    None
                  </span>
                )}

                {relationship && relationship?.objects.length > 3 && (
                  <div className="mt-2 border-t-[1px] py-1 text-center text-manatee-500">
                    <span className="text-xs">Show more</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
