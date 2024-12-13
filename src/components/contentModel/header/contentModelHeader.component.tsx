import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { FormState, UseFormReturn } from "react-hook-form";

import { Button } from "src/components/button";
import { ButtonWithDropdown } from "src/components/buttonWithDropdown";
import {
  calculateContentModelUpdateTypes,
  ContentModelEditorForm,
  ContentModelSectionStatuses,
} from "src/components/contentModel/editor/sections/common.component";
import { Select, SelectOption } from "src/components/inputs/select";
import { CompareSchemaVersionsModal } from "src/components/modals";
import { Tabs } from "src/components/tabs/tabs.component";
import { Tag } from "src/components/tag";
import { useSetContentModelSchemaVersion } from "src/hooks/contentModel/useSetSchemaVersion";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";
import { SchemaVersion } from "src/interfaces/skylark/environment";

interface ContentModelHeaderProps {
  activeSchemaVersion: number;
  schemaVersion: SchemaVersion | null;
  form: UseFormReturn<ContentModelEditorForm>;
  isSaving: boolean;
  onSave: (createNewSchemaVersion?: boolean) => void;
  onCancel: () => void;
}

const getTagConfigurationText = (
  uiConfigurationChanged: boolean,
  relationshipConfigurationChanged: boolean,
) => {
  if (uiConfigurationChanged && relationshipConfigurationChanged) {
    return "Object UI & Relationship configuration";
  }

  if (relationshipConfigurationChanged) {
    return "Object Relationship configuration";
  }

  if (uiConfigurationChanged) {
    return "Object UI configuration";
  }

  return "";
};

const getTagText = (
  schemaVersion: SchemaVersion | null,
  typesOfUpdates: ContentModelSectionStatuses,
  isSaving: boolean,
) => {
  const nonSchemaText = getTagConfigurationText(
    typesOfUpdates.uiConfig,
    typesOfUpdates.relationshipConfig,
  );

  if (typesOfUpdates.schema) {
    const savingText = schemaVersion?.isActive
      ? `Creating new draft schema and updating ${nonSchemaText}`
      : `Updating draft schema and updating ${nonSchemaText}`;
    return isSaving
      ? savingText
      : `Editing schema ${schemaVersion?.version} and ${nonSchemaText}`;
  }

  return isSaving ? `Updating ${nonSchemaText}` : `Editing ${nonSchemaText}`;
};

export const ContentModelHeader = ({
  activeSchemaVersion,
  schemaVersion,
  form,
  isSaving,
  onSave,
  onCancel,
}: ContentModelHeaderProps) => {
  const isEditing = Boolean(form.formState.dirtyFields?.objectTypes);

  const typesOfUpdates = calculateContentModelUpdateTypes(form);

  const [activeSchemaModalIsOpen, setActiveSchemaModalIsOpen] = useState(false);

  const { schemaVersions } = useSchemaVersions();

  const schemaVersionOptions = useMemo(
    () =>
      schemaVersions?.map(
        ({ version, isDraft, baseVersion }): SelectOption<number> => ({
          label: `${version}${version === activeSchemaVersion ? " (active)" : ""}${isDraft ? " (draft)" : ""}`,
          value: version,
          infoTooltip: baseVersion && <p>{`Base version: ${baseVersion}`}</p>,
        }),
      ) || [],
    [activeSchemaVersion, schemaVersions],
  );

  const { setSchemaVersion } = useSetContentModelSchemaVersion();

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="justify-between items-center sticky top-12 md:top-14 bg-white z-10 px-1 w-[calc(100%+0.5rem)] -ml-1 pt-4 mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 md:space-x-4 px-1 border-b border-b-manatee-300 w-full pb-4 relative">
        <Select
          label="Content Model Version:"
          labelVariant="header"
          labelPosition="inline"
          variant="primary"
          placeholder="Version"
          className="z-10"
          selectedInfoTooltipPosition="right"
          options={schemaVersionOptions}
          selected={schemaVersion?.version || undefined}
          onChange={setSchemaVersion}
          disabled={schemaVersionOptions.length === 0 || isEditing}
        />
        <div className="space-x-2 flex">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                danger
                onClick={handleCancel}
                disabled={isSaving}
              >
                {`Cancel`}
              </Button>
              {typesOfUpdates?.schema && schemaVersion?.isDraft ? (
                <ButtonWithDropdown
                  variant="primary"
                  disabled={isSaving}
                  onClick={onSave}
                  options={[
                    {
                      id: "new-draft",
                      text: "Save to new draft version",
                      onClick: () => onSave(true),
                    },
                  ]}
                >{`Update draft version ${schemaVersion.version}`}</ButtonWithDropdown>
              ) : (
                <Button variant="primary" onClick={onSave} disabled={isSaving}>
                  {!typesOfUpdates?.schema
                    ? `Update ${getTagConfigurationText(typesOfUpdates.uiConfig, typesOfUpdates.relationshipConfig)}`
                    : "Save changes to new draft version"}
                </Button>
              )}
            </>
          ) : (
            <>
              {/* <Button
                variant="primary"
                // disabled={}
                onClick={() => setIsEditingSchema(true)}
                // loading={isSaving}
              >
                Activate selected Schema
                {`Edit`}
              </Button> */}
              <Button
                variant="outline"
                disabled={activeSchemaVersion === schemaVersion?.version}
                onClick={() => setActiveSchemaModalIsOpen(true)}
                // loading={isSaving}
              >
                {/* Activate selected Schema */}
                {`Compare to active version (${activeSchemaVersion})`}
              </Button>
            </>
          )}
          {(isEditing || isSaving) && (
            <Tag
              className="absolute -bottom-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap"
              loading={isSaving}
            >
              {getTagText(schemaVersion, typesOfUpdates, isSaving)}
            </Tag>
          )}
        </div>
      </div>
      <CompareSchemaVersionsModal
        isOpen={activeSchemaModalIsOpen}
        setIsOpen={setActiveSchemaModalIsOpen}
        baseVersionNumber={activeSchemaVersion}
        updateVersionNumber={schemaVersion?.version || null}
      />
    </div>
  );
};
