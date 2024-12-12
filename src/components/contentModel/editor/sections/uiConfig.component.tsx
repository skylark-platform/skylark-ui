import { UseFormReturn } from "react-hook-form";

import { ColourPicker } from "src/components/inputs/colourPicker";
import { TextInput } from "src/components/inputs/input";
import { Select } from "src/components/inputs/select";
import { ObjectIdentifierCard } from "src/components/objectIdentifier";
import { SkylarkSystemField, AvailabilityStatus } from "src/interfaces/skylark";
import { createDefaultSkylarkObject } from "src/lib/skylark/objects";

import {
  ContentModelEditorForm,
  FieldHeader,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
  uiDisplayFieldTooltip,
} from "./common.component";

interface UIConfigSectionProps {
  objectType: string;
  form: UseFormReturn<ContentModelEditorForm>;
}

export const UIConfigSection = ({ form, objectType }: UIConfigSectionProps) => {
  const { uiConfig, fields } = form.watch(`objectTypes.${objectType}`);

  return (
    <SectionWrapper data-testid="uiconfig-editor">
      <SectionHeader>UI Config</SectionHeader>
      <div className="">
        <SectionDescription>
          Control how objects of this Object Type are displayed in the UI.
        </SectionDescription>
        {/* <SectionDescription>
          It is unversioned and is based on fields in the active content model.
        </SectionDescription> */}
      </div>
      <div className="flex flex-col lg:grid md:gap-8 grid-cols-2 text-sm text-manatee-600">
        <div className="grid grid-cols-3 w-full items-center auto-rows-fr gap-x-2 mt-4 gap-y-1">
          <FieldHeader
            className="col-span-1"
            tooltip="A mask for the Object Type, in case you want it to display differently in the UI. Useful when you have Object Types with many characters."
          >
            Display name
          </FieldHeader>
          <div className="col-span-2">
            <TextInput
              value={uiConfig?.objectTypeDisplayName || ""}
              onChange={(str) =>
                form.setValue(
                  `objectTypes.${objectType}.uiConfig.objectTypeDisplayName`,
                  str,
                  {
                    shouldDirty: true,
                  },
                )
              }
              placeholder={objectType}
            />
          </div>
          <FieldHeader className="col-span-1" tooltip={uiDisplayFieldTooltip}>
            Display field
          </FieldHeader>
          <div className="col-span-2">
            <Select
              variant="primary"
              options={fields.map(({ name }) => ({
                label: name,
                value: name,
              }))}
              placeholder=""
              selected={uiConfig?.primaryField || SkylarkSystemField.UID}
              onChange={(value) =>
                form.setValue(
                  `objectTypes.${objectType}.uiConfig.primaryField`,
                  value,
                  {
                    shouldDirty: true,
                  },
                )
              }
            />
          </div>
          <FieldHeader
            className="col-span-1"
            tooltip="Colour to represent the Object Type in the UI. Useful to identify an Object Type at a glance."
          >
            Colour
          </FieldHeader>
          <div className="col-span-2">
            <ColourPicker
              colour={uiConfig?.colour || ""}
              onChange={(colour) =>
                form.setValue(
                  `objectTypes.${objectType}.uiConfig.colour`,
                  colour,
                  { shouldDirty: true },
                )
              }
            >
              <span className="group-hover/colour-picker:text-brand-primary text-xs group-hover/colour-picker:underline text-manatee-400">
                Change
              </span>
            </ColourPicker>
          </div>
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
              object={createDefaultSkylarkObject({
                objectType,
                uid: "example",
                display: {
                  colour: uiConfig?.colour || "",
                  objectType: uiConfig?.objectTypeDisplayName || objectType,
                  name: `Example "${uiConfig?.primaryField || SkylarkSystemField.UID}" value`,
                },
                availableLanguages: [],
                availabilityStatus: AvailabilityStatus.Active,
                externalId: "",
                type: null,
              })}
            />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
