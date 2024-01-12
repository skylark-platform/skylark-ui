import { UseFormReturn } from "react-hook-form";

import { Checkbox } from "src/components/inputs/checkbox";
import { Select } from "src/components/inputs/select";
import { ObjectTypePill } from "src/components/pill";
import { SkylarkObjectMeta } from "src/interfaces/skylark";

import {
  ContentModelEditorForm,
  FieldHeader,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
} from "./common.component";

interface RelationshipsSectionProps {
  form: UseFormReturn<ContentModelEditorForm>;
  objectMeta: SkylarkObjectMeta;
  allObjectsMeta: SkylarkObjectMeta[];
}

export const RelationshipsSection = ({
  form,
  objectMeta,
  allObjectsMeta,
}: RelationshipsSectionProps) => {
  const relationshipConfig = form.watch("relationshipConfig");

  return (
    <SectionWrapper data-testid="relationships-editor">
      <SectionHeader>Relationships</SectionHeader>
      <SectionDescription>
        Control the sort field and whether relationships inherit availability
        from objects of this type.
      </SectionDescription>
      <div className="grid grid-cols-7 gap-4 text-manatee-400 font-normal text-sm mt-4">
        <FieldHeader className="col-span-2">Object Type</FieldHeader>
        <FieldHeader className="col-span-2">Name</FieldHeader>
        <FieldHeader className="col-span-2">Sort Field</FieldHeader>
        <FieldHeader>Inherit Availability</FieldHeader>
      </div>
      {objectMeta.relationships.map(({ relationshipName, objectType }) => {
        const config = relationshipConfig?.[relationshipName] || null;

        const relationshipObjectMeta = allObjectsMeta.find(
          ({ name }) => name === objectType,
        );

        return (
          <div
            key={relationshipName}
            className="my-2 bg-white z-30 border shadow border-manatee-300 rounded-lg items-center h-14 px-2 grid gap-4 grid-cols-7"
            data-testid={`relationships-editor-row-${relationshipName}`}
          >
            <ObjectTypePill
              type={objectType}
              className="w-full max-w-28 col-span-2"
              forceActualName
            />
            <p className="col-span-2">{relationshipName}</p>
            <div className="col-span-2">
              <Select
                variant="primary"
                placeholder={null}
                disabled={!relationshipObjectMeta}
                selected={config?.defaultSortField || ""}
                onChange={(str) =>
                  form.setValue(
                    `relationshipConfig.${relationshipName}.defaultSortField`,
                    str,
                    { shouldDirty: true },
                  )
                }
                options={
                  relationshipObjectMeta?.fields.map(({ name }) => ({
                    label: name,
                    value: name,
                  })) ||
                  (config?.defaultSortField && [
                    {
                      value: config?.defaultSortField,
                      label: config?.defaultSortField,
                    },
                  ]) ||
                  []
                }
              />
            </div>
            <div className="flex justify-center items-center col-span-1">
              <Checkbox
                checked={config?.inheritAvailability}
                onCheckedChange={(checkedState) =>
                  form.setValue(
                    `relationshipConfig.${relationshipName}.inheritAvailability`,
                    Boolean(checkedState),
                    { shouldDirty: true },
                  )
                }
              />
            </div>
          </div>
        );
      })}
    </SectionWrapper>
  );
};
