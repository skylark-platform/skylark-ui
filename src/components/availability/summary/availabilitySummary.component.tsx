import clsx from "clsx";

import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObjectConfig } from "src/interfaces/skylark";
import { formatReadableDateTime } from "src/lib/skylark/availability";

const prettifyStrArr = (arr: string[]): string => {
  if (arr.length === 0) {
    return "";
  }

  if (arr.length === 1) {
    return arr[0];
  }

  return `${arr.slice(0, arr.length - 1).join(", ")} & ${arr[arr.length - 1]}`;
};

const buildObjectTypesStr = (
  filteredObjectTypes: string[] | null,
  numObjectTypes?: number,
  allObjectTypesWithConfig?: {
    objectType: string;
    config: ParsedSkylarkObjectConfig;
  }[],
) => {
  if (!filteredObjectTypes) {
    return <>Objects </>;
  }

  if (filteredObjectTypes.length === numObjectTypes) {
    return <>All object types </>;
  }

  const parsedObjectTypes = filteredObjectTypes.map((objectType) => {
    const objectTypeWithConfig = allObjectTypesWithConfig?.find(
      ({ objectType: name }) => name === objectType,
    );
    return objectTypeWithConfig?.config.objectTypeDisplayName || objectType;
  });

  if (filteredObjectTypes.length < 10) {
    return (
      <>
        <strong>{prettifyStrArr(parsedObjectTypes)}</strong> objects{" "}
      </>
    );
  }

  return <>{filteredObjectTypes.length} object types </>;
};

// `"Episode" filtered by "search query"`
// `"Episode, Movie, Season" found for "search query"`
// "5 Object types" in "en-GB" filtered by "search query"
// "5 Object types" in "en-GB" filtered by "search query" available to "Premium, PC"
// "5 Object types" in "en-GB" filtered by "search query" available to "Premium, PC" at "27th August 2020"

export const AvailabilitySummary = ({
  searchType,
  objectTypes,
  language,
  query,
  availability: { dimensions, timeTravel },
}: {
  searchType: SearchType;
  query: string;
  objectTypes: string[] | null;
  language?: string | null;
  availability: {
    dimensions: Record<string, string> | null;
    timeTravel: { datetime: string; timezone: string } | null;
  };
}) => {
  const { objectTypesWithConfig, numObjectTypes } =
    useSkylarkObjectTypesWithConfig();

  const { dimensions: allDimensionsWithValues } =
    useAvailabilityDimensionsWithValues();

  const objectTypeStr = buildObjectTypesStr(
    objectTypes,
    numObjectTypes,
    objectTypesWithConfig,
  );

  const translationStr = language ? (
    <>
      translated to <strong>{language}</strong>{" "}
    </>
  ) : (
    <></>
  );

  const queryStr = query ? (
    <>
      filtered by <strong>query &ldquo;{query}&rdquo;</strong>{" "}
    </>
  ) : (
    <></>
  );

  const lookupStr = query ? (
    <>
      filtered by <strong>UID or External ID &ldquo;{query}&rdquo;</strong>{" "}
    </>
  ) : (
    <></>
  );

  let availabilityStr = <></>;

  if (dimensions || timeTravel) {
    const strDimensions =
      dimensions &&
      Object.entries(dimensions).map(([dimension, value]) => {
        const foundDimension = allDimensionsWithValues?.find(
          (d) => dimension === d.slug,
        );
        const foundValue = foundDimension?.values.find((v) => value === v.slug);

        return foundValue?.title || value;
      });

    const renderedDimensions = strDimensions ? (
      <>
        to <strong>{prettifyStrArr(strDimensions)}</strong> users
      </>
    ) : (
      <></>
    );

    const renderedTimeTravel = timeTravel ? (
      <>
        on{" "}
        <strong>
          {formatReadableDateTime(timeTravel.datetime)}
          {timeTravel.timezone ? ` (${timeTravel.timezone})` : ""}
        </strong>
      </>
    ) : (
      <></>
    );

    availabilityStr =
      renderedDimensions && renderedTimeTravel ? (
        <>
          available {renderedDimensions} {renderedTimeTravel}{" "}
        </>
      ) : (
        <>available {renderedDimensions || renderedTimeTravel} </>
      );
  }

  return (
    <p
      className={clsx(
        "text-xs text-manatee-500 md:whitespace-nowrap md:text-sm",
        "[&>strong]:font-medium [&>strong]:text-black",
        "after:-ml-1 after:content-['.']",
      )}
    >
      {objectTypeStr}
      {searchType === SearchType.Search && queryStr}
      {searchType === SearchType.UIDExtIDLookup && lookupStr}
      {availabilityStr}
      {translationStr}
    </p>
  );
};
