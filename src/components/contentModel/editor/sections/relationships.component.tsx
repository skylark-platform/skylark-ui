import { UseFormReturn } from "react-hook-form";

import { ObjectTypePill } from "src/components/pill";
import { SkylarkObjectMeta } from "src/interfaces/skylark";

import {
  ContentModelEditorForm,
  FieldHeader,
  SectionHeader,
  SectionWrapper,
} from "./common.component";

interface RelationshipsSectionProps {
  form: UseFormReturn<ContentModelEditorForm>;
  objectMeta: SkylarkObjectMeta;
}

export const RelationshipsSection = ({
  objectMeta,
}: RelationshipsSectionProps) => {
  return (
    <SectionWrapper>
      <SectionHeader>Relationships</SectionHeader>
      <div className="grid grid-cols-7 gap-4 text-manatee-400 font-normal text-sm mt-4">
        <FieldHeader className="col-span-2">Object Type</FieldHeader>
        <FieldHeader className="col-span-2">Name</FieldHeader>
        <FieldHeader className="col-span-2">Default Sort Field</FieldHeader>
        {/* <FieldHeader tooltip={uiDisplayFieldTooltip}>
          UI Display field
        </FieldHeader> */}
      </div>
      {objectMeta.relationships.map(({ relationshipName, objectType }) => {
        return (
          <div
            key={relationshipName}
            className="my-2 bg-white z-30 border shadow border-manatee-300 rounded-lg items-center h-14 px-2 grid gap-4 grid-cols-7"
          >
            <ObjectTypePill
              type={objectType}
              className="w-full max-w-28 col-span-2"
              forceActualName
            />
            <p className="col-span-2">{relationshipName}</p>
          </div>
        );
      })}
    </SectionWrapper>
  );
};
