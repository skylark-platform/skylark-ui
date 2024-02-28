import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { useCallback, useMemo } from "react";

import { CompareSchemaVersions } from "src/components/compareSchemasVersions/compareSchemaVersions.component";
import { Select, SelectOption } from "src/components/inputs/select";
import { useSchemaVersions } from "src/hooks/schema/get/useSchemaVersions";
import { useActivationStatus } from "src/hooks/useAccountStatus";

const queryKey = {
  base: "base",
  to: "to",
};

const parseVersionFromQuery = (
  query: ParsedUrlQuery,
  key: string,
): number | null => {
  const value = query[key];
  return value && typeof value === "string" ? parseInt(value) : null;
};

export default function CompareSchemas() {
  const { query, push } = useRouter();

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

  const baseSchemaVersion = parseVersionFromQuery(query, queryKey.base) || 1;
  const updatedSchemaVersion =
    parseVersionFromQuery(query, queryKey.to) ||
    activationStatus?.activeVersion ||
    1;

  const updateURL = useCallback(
    (param: string, value: string) =>
      push({ query: { ...query, [param]: value } }, undefined, {
        shallow: true,
      }),
    [query],
  );

  const setBaseSchemaVersion = (v: number) => updateURL("base", `${v}`);
  const setUpdatedSchemaVersion = (v: number) => updateURL("to", `${v}`);

  return (
    <div className="mx-auto mt-32 flex w-full max-w-5xl flex-col justify-center text-sm">
      <h1 className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl text-center">
        Schema Comparison
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
        baseVersionNumber={baseSchemaVersion}
        updateVersionNumber={updatedSchemaVersion}
      />
    </div>
  );
}
