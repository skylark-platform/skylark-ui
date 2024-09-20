import { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import { Tabs, Tab } from "src/components/tabs/tabs.component";
import {
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";

import { ContentModelEditorForm } from "./sections/common.component";
import { FieldsSection } from "./sections/fields.component";
import { UIConfigSection } from "./sections/uiConfig.component";

interface ObjectTypeEditorProps {
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
  allObjectsMeta: SkylarkObjectMeta[];
  form: UseFormReturn<ContentModelEditorForm>;
  schemaVersion: SchemaVersion;
}

export const ObjectTypeEditor = ({
  objectMeta,
  objectConfig,
  allObjectsMeta,
  schemaVersion,
  form,
}: ObjectTypeEditorProps) => {
  const tabs = useMemo(() => {
    const tabs: Tab<"ui-config" | "metadata" | "relationships">[] = [
      { id: "metadata", name: "Fields" },
    ];

    // if (objectMeta.name !== BuiltInSkylarkObjectType.Availability)
    //   tabs.push({ id: "relationships", name: "Relationships" });

    tabs.push({ id: "ui-config", name: "UI Config" });

    return tabs;
  }, []);

  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div
      key={objectMeta.name}
      className="mb-24 h-full max-w-5xl md:border-l border-manatee-200 md:pl-8"
      data-testid="content-model-editor"
    >
      <div className="flex flex-col mb-10 bg-white z-[5] pt-4 px-1 w-[calc(100%+0.5rem)] -ml-1">
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
          schemaVersion={schemaVersion}
        />
      )}
      {/* {objectMeta.name !== BuiltInSkylarkObjectType.Availability &&
        activeTab.id === "relationships" && (
          <RelationshipsSection
            form={form}
            objectMeta={objectMeta}
            allObjectsMeta={allObjectsMeta}
          />
        )} */}
    </div>
  );
};
