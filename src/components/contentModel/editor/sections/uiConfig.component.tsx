import { UseFormReturn } from "react-hook-form";

import { ColourPicker } from "src/components/inputs/colourPicker";
import { TextInput } from "src/components/inputs/input";
import { Select } from "src/components/inputs/select";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  SkylarkSystemField,
  AvailabilityStatus,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";

import {
  ContentModelEditorForm,
  FieldHeader,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
  uiDisplayFieldTooltip,
} from "./common.component";

interface UIConfigSectionProps {
  form: UseFormReturn<ContentModelEditorForm>;
  objectMeta: SkylarkObjectMeta;
}

export const UIConfigSection = ({ form, objectMeta }: UIConfigSectionProps) => {
  const fieldSections = form.watch("fieldSections");
  const { objectTypeDisplayName, primaryField, colour } =
    form.watch("uiConfig");

  return (
    <SectionWrapper data-testid="uiconfig-editor">
      <SectionHeader>UI Config</SectionHeader>
      <SectionDescription>
        Control how data for this Object Type is displayed in the UI including
        field order and UI field type.
      </SectionDescription>
      <div className="flex flex-col md:grid md:space-x-8 max-md:space-y-8 grid-cols-2 text-sm text-manatee-600">
        <div className="grid grid-cols-3 w-full items-center auto-rows-fr gap-x-2 mt-4 gap-y-1">
          <FieldHeader
            className="col-span-1"
            tooltip="A mask for the Object Type, in case you want it to display differently in the UI. Useful when you have Object Types with many characters."
          >
            Display name
          </FieldHeader>
          {/* <p className="text-black">{objectTypeDisplayName}</p> */}
          <div className="col-span-2">
            <TextInput
              value={objectTypeDisplayName}
              onChange={(str) =>
                form.setValue("uiConfig.objectTypeDisplayName", str, {
                  shouldDirty: true,
                })
              }
              placeholder={objectMeta.name}
            />
          </div>
          <FieldHeader className="col-span-1" tooltip={uiDisplayFieldTooltip}>
            Display field
          </FieldHeader>
          <Select
            className="col-span-2"
            variant="primary"
            options={[
              ...fieldSections.system.fields,
              ...fieldSections.translatable.fields,
              ...fieldSections.global.fields,
            ].map(({ field }) => ({ label: field.name, value: field.name }))}
            placeholder=""
            selected={primaryField || SkylarkSystemField.UID}
            onChange={(value) =>
              form.setValue("uiConfig.primaryField", value, {
                shouldDirty: true,
              })
            }
          />
          <FieldHeader
            className="col-span-1"
            tooltip="Colour to represent the Object Type in the UI. Useful to identify an Object Type at a glance."
          >
            Colour
          </FieldHeader>
          <div className="col-span-2">
            <ColourPicker
              colour={colour || ""}
              onChange={(colour) =>
                form.setValue("uiConfig.colour", colour, { shouldDirty: true })
              }
            >
              <span className="group-hover/colour-picker:text-brand-primary text-xs group-hover/colour-picker:underline text-manatee-400">
                Change
              </span>
            </ColourPicker>
          </div>
          <FieldHeader
            className="col-span-1"
            tooltip="Controls the display order of fields in the UI. System fields cannot be reordered."
          >
            Order
          </FieldHeader>
          <p className="col-span-2">Drag the fields below to reorder.</p>
        </div>
        <div className="flex justify-center items-center">
          <div
            className="flex justify-center flex-col w-full pr-4"
            data-testid="uiconfig-editor-preview"
          >
            <p className="mb-2">Preview:</p>
            <ObjectIdentifierCard
              forceConfigFromObject
              className="shadow px-2"
              object={{
                objectType: objectMeta.name,
                uid: "example",
                config: {
                  primaryField: null,
                  colour,
                  objectTypeDisplayName,
                },
                meta: {
                  language: "",
                  availableLanguages: [],
                  availabilityStatus: AvailabilityStatus.Active,
                  versions: {},
                },
                metadata: {
                  uid: `Example "${primaryField}" value`,
                  external_id: "",
                },
                availability: {
                  status: AvailabilityStatus.Active,
                  objects: [],
                },
              }}
            />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
