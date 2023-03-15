import { Pill } from "src/components/pill";
import {
  DISPLAY_NAME_PRIORITY,
  OBJECT_LIST_TABLE,
} from "src/constants/skylark";
import { useImageSize } from "src/hooks/useImageSize";
import { useObjectRelationships } from "src/hooks/useObjectRelationship";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField, hasProperty } from "src/lib/utils";

const objectOptions: Record<SkylarkObjectType, { fieldsToHide: string[] }> = {
  Image: {
    fieldsToHide: ["external_url", "upload_url", "download_from_url"],
  },
};

interface PanelRelationshipsProps {
  objectType: SkylarkObjectType;
  uid: string;
}

export const PanelRelationships = ({
  objectType,
  uid,
}: PanelRelationshipsProps) => {
  const { data, hasNextPage, isLoading, fetchNextPage, query, variables } =
    useObjectRelationships(objectType, uid);

  console.log("party data ~~", data);
  return (
    <div className="overflow-anywhere h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {data &&
          Object.keys(data)?.map((relation) => {
            return (
              <div key={relation} className="my-2">
                <div className="mb-1 mt-3 bg-manatee-100 p-2 capitalize">
                  <h1>{relation}</h1>
                </div>

                {data[relation].objects.length > 0 ? (
                  data[relation].objects.map((obj) => {
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

                {data[relation].objects.length > 3 && (
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
