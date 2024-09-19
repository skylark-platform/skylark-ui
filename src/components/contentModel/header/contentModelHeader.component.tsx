import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useMemo, useState } from "react";

import { Button } from "src/components/button";
import { Select, SelectOption } from "src/components/inputs/select";
import { CompareSchemaVersionsModal } from "src/components/modals";
import { Tabs } from "src/components/tabs/tabs.component";
import { Tag } from "src/components/tag";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";
import { SchemaVersion } from "src/interfaces/skylark/environment";

interface ContentModelHeaderProps {
  activeSchemaVersion: number;
  schemaVersion: SchemaVersion | null;
  isEditingSchema: boolean;
  isUpdatingSchema: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const ContentModelHeader = ({
  activeSchemaVersion,
  schemaVersion,
  isEditingSchema,
  isUpdatingSchema,
  onSave,
  onCancel,
}: ContentModelHeaderProps) => {
  const { push, query } = useRouter();

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

  const setSchemaVersionWrapper = (value: number) => {
    push(`/content-model/${value}/${query?.slug?.[1] || ""}`);
  };

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
          onChange={setSchemaVersionWrapper}
          disabled={schemaVersionOptions.length === 0 || isEditingSchema}
        />
        <div className="space-x-2">
          {isEditingSchema ? (
            <>
              <Button
                variant="outline"
                // disabled={}
                danger
                onClick={handleCancel}
                // loading={isSaving}
              >
                {/* Activate selected Schema */}
                {`Cancel`}
              </Button>
              <Button
                variant="primary"
                // disabled={}
                onClick={onSave}
                // loading={isSaving}
              >
                {/* Activate selected Schema */}
                {schemaVersion?.isDraft
                  ? `Update draft version ${schemaVersion.version}`
                  : `Save changes to new draft version`}
              </Button>
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
          {(isEditingSchema || isUpdatingSchema) && (
            <Tag
              className="absolute -bottom-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap"
              loading={isUpdatingSchema}
            >
              {/* {schemaVersion?.isDraft
                ? ``
                : `Editing Version: ${schemaVersion?.version}`} */}
              {isEditingSchema &&
                !isUpdatingSchema &&
                `Editing version: ${schemaVersion?.version}`}
              {isUpdatingSchema &&
                (schemaVersion?.isActive
                  ? `Saving changes to new draft version based on ${schemaVersion.version}`
                  : `Updating draft version ${schemaVersion?.version}`)}
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
