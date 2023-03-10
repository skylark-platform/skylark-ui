import { OBJECT_LIST_TABLE } from "src/constants/skylark";
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
  useObjectRelationships(objectType, uid);
  return (
    <div className="overflow-anywhere h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>test it</div>
    </div>
  );
};
