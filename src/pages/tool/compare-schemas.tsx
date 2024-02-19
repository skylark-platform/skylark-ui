import { useMemo, useState } from "react";

import { CompareSchemaVersions } from "src/components/contentModel/compareSchemasVersions/compareSchemaVersions.component";
import { Select, SelectOption } from "src/components/inputs/select";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";
import { useActivationStatus } from "src/hooks/useAccountStatus";

export default function CompareSchemas() {
  const { activationStatus } = useActivationStatus();

  const { schemaVersions } = useSchemaVersions();

  const schemaVersionOptions = useMemo(
    () =>
      schemaVersions?.map(
        ({ version, published, baseVersion }): SelectOption<number> => ({
          label: `${version}${version === activationStatus?.activeVersion ? " (active)" : ""}${!published ? " (draft)" : ""}`,
          value: version,
          infoTooltip: baseVersion && <p>{`Base version: ${baseVersion}`}</p>,
        }),
      ) || [],
    [activationStatus?.activeVersion, schemaVersions],
  );

  const [baseSchemaVersion, setBaseSchemaVersion] = useState<number | null>(
    null,
  );
  const [updatedSchemaVersion, setUpdatedSchemaVersion] = useState<
    number | null
  >(null);

  return (
    <div className="mx-auto mt-32 flex w-full max-w-5xl flex-col justify-center text-sm">
      <h1 className="mb-8 text-center font-heading text-4xl">
        Compare Schemas
      </h1>
      <div className="flex w-full justify-center space-x-4 mb-10">
        <Select
          label="Base Version"
          labelVariant="form"
          variant="primary"
          placeholder="Enter Base Version"
          className="w-72 z-10"
          selectedInfoTooltipPosition="right"
          options={schemaVersionOptions}
          selected={baseSchemaVersion || undefined}
          onChange={setBaseSchemaVersion}
          disabled={schemaVersionOptions.length === 0}
        />
        <Select
          label="Updated Version"
          labelVariant="form"
          variant="primary"
          placeholder="Enter Updated Version"
          className="w-72 z-10"
          selectedInfoTooltipPosition="right"
          options={schemaVersionOptions}
          selected={updatedSchemaVersion || undefined}
          onChange={setUpdatedSchemaVersion}
          disabled={schemaVersionOptions.length === 0}
        />
      </div>
      <CompareSchemaVersions
        baseVersionNumber={baseSchemaVersion || 1}
        updateVersionNumber={
          updatedSchemaVersion || activationStatus?.activeVersion || 0
        }
      />
    </div>
  );
}
