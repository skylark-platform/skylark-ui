import { Dispatch, SetStateAction, useMemo } from "react";

import { Button } from "src/components/button";
import { Select, SelectOption } from "src/components/inputs/select";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";

interface ContentModelHeaderProps {
  activeSchemaVersion: number;
  schemaVersion: number | null;
  setSchemaVersion: Dispatch<SetStateAction<number | null>>;
}

export const ContentModelHeader = ({
  activeSchemaVersion,
  schemaVersion,
  setSchemaVersion,
}: ContentModelHeaderProps) => {
  const { schemaVersions } = useSchemaVersions();

  const schemaVersionOptions = useMemo(
    () =>
      schemaVersions?.map(
        ({ version, published, baseVersion }): SelectOption<number> => ({
          label: `${version}${version === activeSchemaVersion ? " (active)" : ""}${!published ? " (draft)" : ""}`,
          value: version,
          infoTooltip: baseVersion && <p>{`Base version: ${baseVersion}`}</p>,
        }),
      ) || [],
    [activeSchemaVersion, schemaVersions],
  );

  return (
    <div className="grid grid-cols-4 justify-between items-center sticky top-28 bg-white z-10 py-4 px-1 w-[calc(100%+0.5rem)] -ml-1">
      <h1 className="text-xl font-semibold">Content Model Editor</h1>
      <div className="col-span-3 flex items-center justify-between space-x-4 px-1">
        <Select
          label="Schema Version:"
          labelVariant="header"
          labelPosition="inline"
          variant="primary"
          placeholder="Schema Version"
          className="w-72 z-10"
          selectedInfoTooltipPosition="right"
          options={schemaVersionOptions}
          selected={schemaVersion || undefined}
          onChange={setSchemaVersion}
          disabled={schemaVersionOptions.length === 0}
        />
        {/* <div className="space-x-2">
          <Button
            variant="primary"
            disabled={activeSchemaVersion === schemaVersion}
            // onClick={onSave}
            // loading={isSaving}
            // loading={
            //   isUpdatingObjectTypeConfig || isUpdatingRelationshipConfig
            // }
            // disabled={!form.formState.isDirty}
          >
            Make active version
          </Button>
        </div> */}
      </div>
    </div>
  );
};
