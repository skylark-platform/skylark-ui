import { useState } from "react";

import { Tabs } from "src/components/tabs/tabs.component";

import { CompareSchemaVersionsProps } from "./diffs/common.component";
import { EnumsDiff } from "./diffs/enumsDiff.component";
import { ObjectTypesDiff } from "./diffs/objectTypesDiff.component";

const tabs: { id: "objectTypes" | "enums"; name: string }[] = [
  { id: "objectTypes", name: "Object Types" },
  { id: "enums", name: "Enums" },
];

export const CompareSchemaVersions = (props: CompareSchemaVersionsProps) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[0]["id"]>(
    tabs[0].id,
  );

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="flex space-x-2 px-6 md:px-10">
        <Tabs
          tabs={tabs}
          selectedTab={activeTab || tabs?.[0].id}
          onChange={({ id }) => setActiveTab(id)}
          className="border-b"
          // disabled
        />
        {/* TODO - do we want to enable filtering by status? */}
        {/* <Select options={[{ value: "modified", label: "Modified" }]} /> */}
      </div>
      <div className="grow overflow-y-scroll py-6 px-6 md:px-10">
        {activeTab === "objectTypes" && <ObjectTypesDiff {...props} />}
        {activeTab === "enums" && <EnumsDiff {...props} />}
      </div>
    </div>
  );
};
