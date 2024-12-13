import { pascalCase, snakeCase } from "change-case";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

import { Spinner } from "src/components/icons";
import {
  CreateObjectTypeModal,
  CreateObjectTypeModalForm,
} from "src/components/modals/createObjectTypeModal/createObjectTypeModal";
import { useSetContentModelSchemaVersion } from "src/hooks/contentModel/useSetSchemaVersion";
import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectConfigFieldConfig,
  SkylarkObjectMeta,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";

import { ObjectTypeSelectAndOverview } from "../navigation/contentModelNavigation.component";
import {
  ContentModelEditorForm,
  ContentModelEditorFormObjectTypeField,
  ContentModelEditorFormObjectTypeUiConfig,
} from "./sections/common.component";
import { FieldsSection } from "./sections/fields.component";
import { UIConfigSection } from "./sections/uiConfig.component";

interface ObjectTypeEditorProps {
  objectType: string;
  form: UseFormReturn<ContentModelEditorForm>;
  activeSchemaVersionNumber: number;
  schemaVersion: SchemaVersion;
}

const defaultFields: NormalizedObjectField[] = [
  {
    name: SkylarkSystemField.UID,
    type: "string",
    originalType: "String",
    isRequired: false,
    isList: false,
    isGlobal: true,
    isTranslatable: false,
    isUnversioned: true,
  },
  {
    name: SkylarkSystemField.ExternalID,
    type: "string",
    originalType: "String",
    isRequired: false,
    isList: false,
    isGlobal: true,
    isTranslatable: false,
    isUnversioned: true,
  },
  {
    name: SkylarkSystemField.Slug,
    type: "string",
    originalType: "String",
    isRequired: false,
    isList: false,
    isGlobal: false,
    isTranslatable: true,
    isUnversioned: true,
  },
];

const defaultUiConfigFieldConfigs: ContentModelEditorFormObjectTypeUiConfig["fieldConfigs"] =
  Object.fromEntries(
    defaultFields.map(
      ({
        name,
      }): [
        string,
        ContentModelEditorFormObjectTypeUiConfig["fieldConfigs"][""],
      ] => [name, { fieldType: null }],
    ),
  );

const defaultUiConfig: ContentModelEditorFormObjectTypeUiConfig = {
  objectTypeDisplayName: "",
  colour: "",
  primaryField: SkylarkSystemField.Slug,
  fieldConfigs: defaultUiConfigFieldConfigs,
  fieldOrder: Object.keys(defaultUiConfigFieldConfigs),
};

export const ContentModelEditor = ({
  objectType,
  form,
  activeSchemaVersionNumber,
  schemaVersion,
}: ObjectTypeEditorProps) => {
  const validObjectTypes = form.watch("objectTypeNames");
  const setObjectTypes = form.watch("setObjectTypeNames");

  const { setSchemaVersion } = useSetContentModelSchemaVersion();

  const [addObjectModalIsOpen, setAddObjectModalIsOpen] = useState(false);

  const addNewObjectType = ({ name, type }: CreateObjectTypeModalForm) => {
    form.setValue(
      "objectTypeNames",
      [...new Set([...validObjectTypes, name])],
      {
        shouldDirty: true,
      },
    );
    form.setValue(
      `objectTypes.${name}`,
      {
        fields: defaultFields,
        uiConfig: defaultUiConfig,
        isNew: true,
        isSet: type === "set" ? true : false,
        isBuiltIn: false,
      },
      { shouldDirty: true },
    );

    setSchemaVersion(schemaVersion.version, name);
    setAddObjectModalIsOpen(false);
  };

  return (
    <>
      {validObjectTypes && validObjectTypes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-8">
          <ObjectTypeSelectAndOverview
            objectTypes={validObjectTypes}
            setObjectTypes={setObjectTypes}
            activeObjectType={objectType}
            activeSchemaVersionNumber={activeSchemaVersionNumber}
            schemaVersion={schemaVersion}
            onAddNewObjectType={() => setAddObjectModalIsOpen(true)}
          />
          <div className="md:col-span-3 xl:col-span-4 h-full">
            {validObjectTypes.includes(objectType) ? (
              <div
                key={objectType}
                className="mb-24 h-full max-w-5xl md:border-l border-manatee-200 md:pl-8"
                data-testid="content-model-editor"
              >
                <UIConfigSection form={form} objectType={objectType} />
                <FieldsSection form={form} objectType={objectType} />
              </div>
            ) : (
              <p className="mt-10">
                Requested Object Type &quot;
                <span className="font-medium">{objectType}</span>
                &quot; does not exist in this schema version.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex mt-32 justify-center w-full h-full items-center col-span-full">
          <Spinner className="h-14 w-14 animate-spin" />
        </div>
      )}
      <CreateObjectTypeModal
        setIsOpen={setAddObjectModalIsOpen}
        isOpen={addObjectModalIsOpen}
        onSubmit={addNewObjectType}
      />
    </>
  );
};
