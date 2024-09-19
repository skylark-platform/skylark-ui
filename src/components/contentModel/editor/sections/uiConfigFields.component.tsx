import { Reorder } from "framer-motion";
import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";

import {
  ObjectTypeFieldInput,
  ObjectTypeUIConfigFieldInput,
} from "src/components/contentModel/editor/contentModelRowInput.component";
import {
  InputFieldWithFieldConfig,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfig,
} from "src/interfaces/skylark";

import {
  ContentModelEditorForm,
  FieldHeader,
  FieldType,
  SectionHeader,
  SectionWrapper,
  UIConfigForm,
} from "./common.component";

interface FieldsSectionProps {
  form: UseFormReturn<UIConfigForm>;
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
}

const FieldSection = ({
  title,
  fields,
  objectMeta,
  objectConfig,
  disableReorder,
  onChange,
}: {
  title: string;
  fields: InputFieldWithFieldConfig[];
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
  disableReorder?: boolean;
  onChange: (fields: InputFieldWithFieldConfig[]) => void;
}) => {
  const handleChange = useCallback(
    (updatedFieldWithConfig: InputFieldWithFieldConfig) => {
      const updatedFields = fields.map((fieldWithConfig) => {
        if (fieldWithConfig.field.name === updatedFieldWithConfig.field.name) {
          return {
            ...fieldWithConfig,
            ...updatedFieldWithConfig,
          };
        }
        return fieldWithConfig;
      });

      onChange(updatedFields);
    },
    [fields, onChange],
  );

  return (
    <div className="mt-4 mb-10">
      <h4 className="mt-4 mb-2 text-lg font-medium">{title}</h4>
      <div className="grid grid-cols-3 gap-4 text-manatee-400 font-normal text-sm">
        <FieldHeader>Name</FieldHeader>
        <FieldHeader>Type</FieldHeader>
        <FieldHeader>UI type</FieldHeader>
      </div>
      <Reorder.Group onReorder={onChange} values={fields}>
        {fields.map((fieldWithConfig) => {
          const fieldName = fieldWithConfig.field.name;
          return (
            <ObjectTypeUIConfigFieldInput
              key={`${objectMeta.name}-${fieldName}`}
              fieldWithConfig={fieldWithConfig}
              objectMeta={objectMeta}
              disableReorder={disableReorder}
              onChange={handleChange}
            />
          );
        })}
      </Reorder.Group>
    </div>
  );
};

// export const UIConfigFieldsSection = ({
//   objectMeta,
//   form,
//   objectConfig,
// }: FieldsSectionProps) => {
//   const onFieldChange = useCallback(
//     (id: FieldType, reorderedFields: InputFieldWithFieldConfig[]) => {
//       form.setValue(`fieldSections.${id}.fields`, reorderedFields, {
//         shouldDirty: true,
//       });
//     },
//     [form],
//   );

//   const fieldSections = form.watch("fieldSections");

//   return (
//     <div className="w-full col-span-2 mt-8">
//       {/* <SectionHeader>Fields</SectionHeader> */}
//       {/* TODO add Skeleton here with hardcoded headings as sections headers can be filtered out when no fields exist */}
//       {Object.entries(fieldSections).map(([id, { title, fields }]) => (
//         <FieldSection
//           key={id}
//           title={title}
//           fields={fields}
//           objectMeta={objectMeta}
//           objectConfig={objectConfig}
//           disableReorder={id === "system"}
//           onChange={(fieldsWithConfig) =>
//             onFieldChange(id as FieldType, fieldsWithConfig)
//           }
//         />
//       ))}
//     </div>
//   );
// };
