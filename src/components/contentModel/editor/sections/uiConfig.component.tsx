import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { ColourPicker } from "src/components/inputs/colourPicker";
import { TextInput } from "src/components/inputs/input";
import { Select } from "src/components/inputs/select";
import { ObjectIdentifierCard } from "src/components/objectIdentifier";
import { Toast } from "src/components/toast/toast.component";
import { useUpdateObjectTypeConfig } from "src/hooks/schema/update/useUpdateObjectTypeConfig";
import {
  SkylarkSystemField,
  AvailabilityStatus,
  SkylarkObjectMeta,
  ParsedSkylarkObjectConfig,
} from "src/interfaces/skylark";
import {
  convertParsedObjectToIdentifier,
  createDefaultSkylarkObject,
} from "src/lib/skylark/objects";

import {
  FieldHeader,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
  UIConfigForm,
  uiDisplayFieldTooltip,
} from "./common.component";

// import { UIConfigFieldsSection } from "./uiConfigFields.component";

interface UIConfigSectionProps {
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
}

export const UIConfigSection = ({
  objectMeta,
  objectConfig,
}: UIConfigSectionProps) => {
  // const fieldSections = form.watch("fieldSections");
  // const { objectTypeDisplayName, primaryField, colour } =
  //   form.watch("uiConfig");

  const form = useForm<UIConfigForm>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
    values: {
      objectTypeDisplayName:
        objectConfig?.objectTypeDisplayName || objectMeta.name,
      primaryField: objectConfig?.primaryField,
      colour: objectConfig?.colour,
    },
  });

  const { objectTypeDisplayName, primaryField, colour } = form.watch();

  const { updateObjectTypeConfig, isUpdatingObjectTypeConfig } =
    useUpdateObjectTypeConfig({
      onSuccess: () => {
        form.reset(undefined, { keepValues: true });
        toast.success(
          <Toast
            title={`Object Type config updated`}
            message={[
              "You may have to refresh for the configuration changes to take effect.",
            ]}
          />,
        );
      },
      onError: () => {
        toast.error(
          <Toast
            title={`Object type config update failed`}
            message={[
              "Unable to update the Object Type.",
              "Please try again later.",
            ]}
          />,
        );
      },
    });

  const onSave = () => {
    // const fieldConfig: ParsedSkylarkObjectConfigFieldConfig[] = [
    //   ...fieldSections.system.fields,
    //   ...fieldSections.translatable.fields,
    //   ...fieldSections.global.fields,
    // ].map(
    //   (fieldWithConfig, index): ParsedSkylarkObjectConfigFieldConfig => ({
    //     name: fieldWithConfig.field.name,
    //     fieldType: fieldWithConfig.config?.fieldType || null,
    //     position: index + 1,
    //   }),
    // );
    const parsedConfig: ParsedSkylarkObjectConfig = {
      ...objectConfig,
      primaryField,
      // fieldConfig,
      objectTypeDisplayName,
      colour,
    };

    updateObjectTypeConfig({
      objectType: objectMeta.name,
      ...parsedConfig,
    });
  };

  return (
    <SectionWrapper data-testid="uiconfig-editor">
      <SectionHeader>UI Config</SectionHeader>
      <div className="flex justify-between items-start flex-col md:flex-row bg-white w-full z-20">
        <div className="md:max-w-[50%]">
          <SectionDescription>
            Control how data for this Object Type is displayed in the UI
            including field order and UI field type.
          </SectionDescription>
          <SectionDescription>
            It is unversioned and is based on the active content model.
          </SectionDescription>
        </div>
        <div className="space-x-2 flex justify-center">
          <Button
            variant="primary"
            onClick={onSave}
            loading={isUpdatingObjectTypeConfig}
          >
            Update UI Config
          </Button>
          <Button
            variant="outline"
            danger
            onClick={() => form.reset()}
            disabled={isUpdatingObjectTypeConfig}
          >
            Cancel
          </Button>
        </div>
      </div>
      <div className="flex flex-col lg:grid md:gap-8 grid-cols-2 text-sm text-manatee-600">
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
                form.setValue("objectTypeDisplayName", str, {
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
            options={
              //   [
              //   ...fieldSections.system.fields,
              //   ...fieldSections.translatable.fields,
              //   ...fieldSections.global.fields,
              // ]
              objectMeta.fields.map(({ name }) => ({
                label: name,
                value: name,
              }))
            }
            placeholder=""
            selected={primaryField || SkylarkSystemField.UID}
            onChange={(value) =>
              form.setValue("primaryField", value, {
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
                form.setValue("colour", colour, { shouldDirty: true })
              }
            >
              <span className="group-hover/colour-picker:text-brand-primary text-xs group-hover/colour-picker:underline text-manatee-400">
                Change
              </span>
            </ColourPicker>
          </div>
          {/* <FieldHeader
            className="col-span-1"
            tooltip="Controls the display order of fields in the UI. System fields cannot be reordered."
          >
            Order
          </FieldHeader>
          <p className="col-span-2">
            Drag the fields on the metadata tab to reorder.
          </p> */}
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
                objectType: objectMeta.name,
                uid: "example",
                display: {
                  colour,
                  objectType: objectTypeDisplayName,
                  name: `Example "${primaryField}" value`,
                },
                availableLanguages: [],
                availabilityStatus: AvailabilityStatus.Active,
                externalId: "",
                type: null,
              })}
            />
          </div>
        </div>
        {/* <UIConfigFieldsSection
          form={form}
          objectMeta={objectMeta}
          objectConfig={objectConfig}
        /> */}
      </div>
    </SectionWrapper>
  );
};
