import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { SkylarkObjectMetadataField } from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

export const PanelMetadata = ({
  metadata,
}: {
  metadata: Record<string, SkylarkObjectMetadataField>;
}) => (
  <div className=" h-full overflow-y-scroll p-4 pb-12 text-sm md:p-8">
    {metadata &&
      Object.keys(metadata).map(
        (property) =>
          property !== OBJECT_LIST_TABLE.columnIds.objectType && (
            <div key={property}>
              <h3 className="mb-2 font-bold ">{formatObjectField(property)}</h3>
              <div className="mb-4 break-words text-base-content">
                {metadata[property] ? metadata[property] : "---"}
              </div>
            </div>
          ),
      )}
  </div>
);
