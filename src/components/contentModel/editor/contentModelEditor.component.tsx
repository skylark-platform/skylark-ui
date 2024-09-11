import { useMemo, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { Tabs, Tab } from "src/components/tabs/tabs.component";
import { Toast } from "src/components/toast/toast.component";
import { SYSTEM_FIELDS } from "src/constants/skylark";
import { useUpdateObjectTypeConfig } from "src/hooks/schema/update/useUpdateObjectTypeConfig";
import { useUpdateRelationshipConfig } from "src/hooks/schema/update/useUpdateRelationshipConfig";
import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfigFieldConfig,
  InputFieldWithFieldConfig,
  ParsedSkylarkObjectTypeRelationshipConfiguration,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { isSkylarkObjectType } from "src/lib/utils";

import {
  ContentModelEditorForm,
  createFieldSections,
  FieldSectionObject,
} from "./sections/common.component";
import { FieldsSection } from "./sections/fields.component";
import { RelationshipsSection } from "./sections/relationships.component";
import { UIConfigSection } from "./sections/uiConfig.component";

export const ObjectTypeEditor = ({
  isEditingSchema,
  objectMeta,
  objectConfig,
  allObjectsMeta,
  form,
}: {
  isEditingSchema: boolean;
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
  allObjectsMeta: SkylarkObjectMeta[];
  form: UseFormReturn<ContentModelEditorForm>;
}) => {
  const tabs = useMemo(() => {
    const tabs: Tab<"ui-config" | "metadata" | "relationships">[] = [
      { id: "metadata", name: "Fields" },
    ];

    if (objectMeta.name !== BuiltInSkylarkObjectType.Availability)
      tabs.push({ id: "relationships", name: "Relationships" });

    tabs.push({ id: "ui-config", name: "UI Config" });

    return tabs;
  }, [objectMeta.name]);

  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div
      key={objectMeta.name}
      className="mb-24 h-full max-w-5xl md:border-l border-manatee-200 md:pl-8"
      data-testid="content-model-editor"
    >
      <div className="flex flex-col mb-10 bg-white z-[5] pt-4 px-1 w-[calc(100%+0.5rem)] -ml-1">
        <div className="flex w-full justify-between">
          {/* <div className="flex flex-col items-start">
            <h3 className="text-2xl font-semibold">{objectMeta.name}</h3>
            <p className="text-sm text-manatee-400">
              {isSkylarkObjectType(objectMeta.name)
                ? "System Object"
                : "Custom Object"}
            </p>
          </div> */}
          {/* <div className="space-x-2">
            <Button
              variant="outline"
              danger
              disabled={
                isUpdatingObjectTypeConfig ||
                isUpdatingRelationshipConfig ||
                !form.formState.isDirty
              }
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              loading={
                isUpdatingObjectTypeConfig || isUpdatingRelationshipConfig
              }
              disabled={!form.formState.isDirty}
            >
              Save
            </Button>
          </div> */}
        </div>
        <div className="border-b border-b-manatee-100 -mt-8">
          <Tabs
            tabs={tabs}
            selectedTab={activeTab.id}
            onChange={setActiveTab}
            className="mt-4"
          />
        </div>
      </div>
      {activeTab.id === "ui-config" && (
        <UIConfigSection objectMeta={objectMeta} objectConfig={objectConfig} />
      )}
      {activeTab.id === "metadata" && (
        <FieldsSection
          form={form}
          objectMeta={objectMeta}
          isEditingSchema={isEditingSchema}
        />
      )}
      {objectMeta.name !== BuiltInSkylarkObjectType.Availability &&
        activeTab.id === "relationships" && (
          <RelationshipsSection
            form={form}
            objectMeta={objectMeta}
            allObjectsMeta={allObjectsMeta}
            isEditingSchema={isEditingSchema}
          />
        )}
    </div>
  );
};
