import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
  FieldSectionObject,
} from "./sections/common.component";
import { FieldsSection } from "./sections/fields.component";
import { RelationshipsSection } from "./sections/relationships.component";
import { UIConfigSection } from "./sections/uiConfig.component";

const reverseInheritAvailabilityErrorMessage =
  "reverse relationship already inherits";

const combineFieldAndFieldConfigAndSortByConfigPostion = (
  inputFields: NormalizedObjectField[],
  getFields: NormalizedObjectField[],
  objectFieldConfig?: ParsedSkylarkObjectConfig,
): InputFieldWithFieldConfig[] => {
  // Some fields are not in input fields but we need to display them anyway, e.g. UID
  const inputFieldNames = inputFields.map(({ name }) => name);
  const missingInputFields = getFields.filter(
    ({ name }) => !inputFieldNames.includes(name),
  );

  const inputFieldsWithFieldConfig = [...inputFields, ...missingInputFields]
    .map((field) => {
      const config = objectFieldConfig?.fieldConfig?.find(
        ({ name }) => name === field.name,
      );

      return {
        field,
        config,
      };
    })
    .sort(({ config: configA }, { config: configB }) =>
      (configA?.position ?? Infinity) > (configB?.position ?? Infinity)
        ? 1
        : -1,
    );

  return inputFieldsWithFieldConfig;
};

const splitFieldsIntoSystemGlobalTranslatable = (
  inputFieldsWithFieldConfig: InputFieldWithFieldConfig[],
  objectMetaFieldConfig: SkylarkObjectMeta["fieldConfig"],
) => {
  const splitFields = inputFieldsWithFieldConfig.reduce(
    (prev, fieldWithConfig) => {
      const fieldName = fieldWithConfig.field.name;

      if (SYSTEM_FIELDS.includes(fieldName)) {
        return {
          ...prev,
          systemFields: [...prev.systemFields, fieldWithConfig].sort(
            ({ field: a }, { field: b }) =>
              SYSTEM_FIELDS.indexOf(a.name) - SYSTEM_FIELDS.indexOf(b.name),
          ),
        };
      }

      if (objectMetaFieldConfig.global.includes(fieldName)) {
        return {
          ...prev,
          globalFields: [...prev.globalFields, fieldWithConfig],
        };
      }

      if (objectMetaFieldConfig.translatable.includes(fieldName)) {
        return {
          ...prev,
          translatableFields: [...prev.translatableFields, fieldWithConfig],
        };
      }

      return prev;
    },
    {
      systemFields: [] as InputFieldWithFieldConfig[],
      translatableFields: [] as InputFieldWithFieldConfig[],
      globalFields: [] as InputFieldWithFieldConfig[],
    },
  );

  return splitFields;
};

const createFieldSections = (
  objectMeta: SkylarkObjectMeta,
  objectFieldConfig?: ParsedSkylarkObjectConfig,
) => {
  const fieldsWithConfig = combineFieldAndFieldConfigAndSortByConfigPostion(
    objectMeta.operations.create.inputs,
    objectMeta.fields,
    objectFieldConfig,
  );

  const splitFields = splitFieldsIntoSystemGlobalTranslatable(
    fieldsWithConfig,
    objectMeta.fieldConfig,
  );

  const sections: FieldSectionObject = {
    system: {
      title: "System",
      fields: splitFields?.systemFields || [],
    },
    translatable: {
      title: "Translatable",
      fields: splitFields?.translatableFields || [],
    },
    global: {
      title: "Global",
      fields: splitFields?.globalFields || [],
    },
  };

  return sections;
};

export const ObjectTypeEditor = ({
  objectMeta,
  objectConfig,
  allObjectsMeta,
  relationshipConfig,
}: {
  objectMeta: SkylarkObjectMeta;
  objectConfig?: ParsedSkylarkObjectConfig;
  allObjectsMeta: SkylarkObjectMeta[];
  relationshipConfig: ParsedSkylarkObjectTypeRelationshipConfiguration;
}) => {
  const form = useForm<ContentModelEditorForm>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
    values: {
      fieldSections: createFieldSections(objectMeta, objectConfig),
      uiConfig: {
        objectTypeDisplayName:
          objectConfig?.objectTypeDisplayName || objectMeta.name,
        primaryField: objectConfig?.primaryField,
        colour: objectConfig?.colour,
      },
      relationshipConfig,
    },
  });

  const tabs = useMemo(() => {
    const tabs: Tab<"ui-config" | "metadata" | "relationships">[] = [
      { id: "ui-config", name: "UI Config" },
      { id: "metadata", name: "Metadata" },
    ];

    if (objectMeta.name !== BuiltInSkylarkObjectType.Availability)
      tabs.push({ id: "relationships", name: "Relationships" });

    return tabs;
  }, [objectMeta.name]);

  const [activeTab, setActiveTab] = useState(tabs[0]);

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

  const { updateRelationshipConfig, isUpdatingRelationshipConfig } =
    useUpdateRelationshipConfig({
      onSuccess: () => {
        form.reset(undefined, { keepValues: true });
        toast.success(
          <Toast
            title={`Relationship config updated`}
            message={[
              "You may have to refresh for the configuration changes to take effect.",
              "Additionally, sort field changes will only become active next time you modify the relationship.",
            ]}
          />,
        );
      },
      onError: (e) => {
        const otherErrors = e.response.errors.filter(
          ({ message }) =>
            message.toLowerCase() !== reverseInheritAvailabilityErrorMessage,
        );
        const inheritAvailabilityErrs = e.response.errors.filter(
          ({ message }) =>
            message.toLowerCase() === reverseInheritAvailabilityErrorMessage,
        );

        if (inheritAvailabilityErrs.length > 0) {
          const inheritAvailabilityReverseMessage =
            'Cannot enable "inherit availability" on the following relationships as it is enabled on the reverse relationship.';

          const formattedErrs = inheritAvailabilityErrs.map(
            (err) => ` - ${err.path[0].split("_")[1]}`,
          );

          toast.error(
            <Toast
              title={`Relationship config update failed`}
              message={[inheritAvailabilityReverseMessage, ...formattedErrs]}
            />,
          );
        }

        if (otherErrors.length > 0) {
          toast.error(
            <Toast
              title={`Relationship config update failed`}
              message={[
                "Error when updating the Relationship config.",
                "Please try again later.",
                ...otherErrors.map((error) => `- ${error.message}`),
              ]}
            />,
          );
        }
      },
    });

  const onSave = () => {
    form.handleSubmit(
      ({
        fieldSections,
        uiConfig: { primaryField, objectTypeDisplayName, colour },
        relationshipConfig,
      }) => {
        if (
          form.formState.dirtyFields.uiConfig ||
          form.formState.dirtyFields.fieldSections
        ) {
          const fieldConfig: ParsedSkylarkObjectConfigFieldConfig[] = [
            ...fieldSections.system.fields,
            ...fieldSections.translatable.fields,
            ...fieldSections.global.fields,
          ].map(
            (fieldWithConfig, index): ParsedSkylarkObjectConfigFieldConfig => ({
              name: fieldWithConfig.field.name,
              fieldType: fieldWithConfig.config?.fieldType || null,
              position: index + 1,
            }),
          );
          const parsedConfig: ParsedSkylarkObjectConfig = {
            ...objectConfig,
            primaryField,
            fieldConfig,
            objectTypeDisplayName,
            colour,
          };

          updateObjectTypeConfig({
            objectType: objectMeta.name,
            ...parsedConfig,
          });
        }

        if (
          form.formState.dirtyFields.relationshipConfig &&
          relationshipConfig
        ) {
          updateRelationshipConfig({
            objectType: objectMeta.name,
            relationshipConfig,
          });
        }
      },
    )();
  };

  return (
    <div
      key={objectMeta.name}
      className="mb-24 h-full"
      data-testid="content-model-editor"
    >
      <div className="flex flex-col mb-10 sticky top-44 -mt-2 bg-white z-[5] pt-4 px-1 w-[calc(100%+0.5rem)] -ml-1">
        <div className="flex w-full justify-between">
          <div className="flex flex-col items-start">
            <h3 className="text-2xl font-semibold">{objectMeta.name}</h3>
            <p className="text-sm text-manatee-400">
              {isSkylarkObjectType(objectMeta.name)
                ? "System Object"
                : "Custom Object"}
            </p>
          </div>
          <div className="space-x-2">
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
          </div>
        </div>
        <Tabs
          tabs={tabs}
          selectedTab={activeTab.id}
          onChange={setActiveTab}
          className="mt-4 border-b"
        />
      </div>
      {activeTab.id === "ui-config" && (
        <UIConfigSection form={form} objectMeta={objectMeta} />
      )}
      {activeTab.id === "metadata" && (
        <FieldsSection
          form={form}
          objectMeta={objectMeta}
          objectConfig={objectConfig}
        />
      )}
      {objectMeta.name !== BuiltInSkylarkObjectType.Availability &&
        activeTab.id === "relationships" && (
          <RelationshipsSection
            form={form}
            objectMeta={objectMeta}
            allObjectsMeta={allObjectsMeta}
          />
        )}
    </div>
  );
};
