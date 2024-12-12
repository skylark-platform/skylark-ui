import { UseFormReturn } from "react-hook-form";

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
  form: UseFormReturn<ContentModelEditorForm>;
}

export const ObjectTypeEditor = ({
  objectMeta,
  form,
}: ObjectTypeEditorProps) => {
  return (
    <div
      key={objectMeta.name}
      className="mb-24 h-full max-w-5xl md:border-l border-manatee-200 md:pl-8"
      data-testid="content-model-editor"
    >
      <UIConfigSection form={form} objectType={objectMeta.name} />
      <FieldsSection form={form} objectType={objectMeta.name} />
    </div>
  );
};
