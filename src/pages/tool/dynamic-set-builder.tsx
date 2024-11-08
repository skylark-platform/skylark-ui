import { DynamicContentConfigurationEditor } from "src/components/dynamicContentConfigurationEditor/dynamicContentConfigurationEditor.component";

export default function DynamicSets() {
  return (
    <div className="pt-40 max-w-6xl mx-auto w-full px-8">
      <DynamicContentConfigurationEditor
        initialConfiguration={null}
        onConfigurationChange={console.log}
      />
    </div>
  );
}
