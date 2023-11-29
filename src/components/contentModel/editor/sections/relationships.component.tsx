import { UseFormReturn } from "react-hook-form";

import { Select } from "src/components/inputs/select";
import { ObjectTypePill } from "src/components/pill";
import { useObjectTypeRelationshipConfiguration } from "src/hooks/useObjectTypeRelationshipConfiguration";
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
  allObjectsMeta: SkylarkObjectMeta[];
}

export const RelationshipsSection = ({
  objectMeta,
  allObjectsMeta,
}: RelationshipsSectionProps) => {
  const {
    objectTypeRelationshipConfig,
    isLoading: isLoadingRelationshipConfig,
    enabled: isRelationshipConfigEnabled,
  } = useObjectTypeRelationshipConfiguration(objectMeta.name);

  return (
    <SectionWrapper data-testid="relationships-editor">
      <SectionHeader>Relationships</SectionHeader>
      <div className="grid grid-cols-7 gap-4 text-manatee-400 font-normal text-sm mt-4">
        <FieldHeader className="col-span-2">Object Type</FieldHeader>
        <FieldHeader className="col-span-2">Name</FieldHeader>
        <FieldHeader className="col-span-2">Sort Field</FieldHeader>
        {/* <FieldHeader tooltip={uiDisplayFieldTooltip}>
          UI Display field
        </FieldHeader> */}
      </div>
      {objectMeta.relationships.map(({ relationshipName, objectType }) => {
        const { config } = objectTypeRelationshipConfig?.find(
          (relationshipConfiguration) =>
            relationshipConfiguration.relationshipName === relationshipName,
        ) || { config: null };

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
            {isRelationshipConfigEnabled && (
              <div className="col-span-2">
                {isLoadingRelationshipConfig ? (
                  <p className="text-sm text-manatee-700">Loading...</p>
                ) : (
                  <Select
                    variant="primary"
                    placeholder={null}
                    disabled
                    // disabled={!relationshipObjectMeta}
                    selected={config?.defaultSortField || ""}
                    onChange={console.log}
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
                )}
              </div>
            )}
          </div>
        );
      })}
    </SectionWrapper>
  );
};
