import clsx from "clsx";

import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { formatReadableDate } from "src/lib/skylark/availability";

const prettifyStrArr = (arr: string[]): string => {
  if (arr.length === 0) {
    return "";
  }

  if (arr.length === 1) {
    return arr[0];
  }

  return `${arr.slice(0, arr.length - 1).join(", ")} & ${arr[arr.length - 1]}`;
};

// `"Episode" filtered by "search query"`
// `"Episode, Movie, Season" found for "search query"`
// "5 Object types" in "en-GB" filtered by "search query"
// "5 Object types" in "en-GB" filtered by "search query" available to "Premium, PC"
// "5 Object types" in "en-GB" filtered by "search query" available to "Premium, PC" at "27th August 2020"

export const AvailabilitySummary = ({
  objectTypes,
  language,
  query,
  availability: { dimensions, timeTravel },
}: {
  query: string;
  objectTypes: string[] | null;
  language?: string | null;
  availability: {
    dimensions: Record<string, string> | null;
    timeTravel: { datetime: string; timezone: string } | null;
  };
}) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { dimensions: allDimensionsWithValues } =
    useAvailabilityDimensionsWithValues();

  let objectTypeStr = <>Objects </>;

  if (objectTypes) {
    const parsedObjectTypes = objectTypes.map((objectType) => {
      const objectTypeWithConfig = objectTypesWithConfig?.find(
        ({ objectType: name }) => name === objectType,
      );
      return objectTypeWithConfig?.config.objectTypeDisplayName || objectType;
    });

    objectTypeStr =
      objectTypes.length < 10 ? (
        <>
          <strong>{prettifyStrArr(parsedObjectTypes)}</strong> objects{" "}
        </>
      ) : (
        <>
          <strong>
            {objectTypesWithConfig?.length === objectTypes.length
              ? "All"
              : objectTypes.length}
          </strong>{" "}
          object types{" "}
        </>
      );
  }

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
          {formatReadableDate(timeTravel.datetime)}
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
        "text-xs text-manatee-500 md:text-sm",
        "[&>strong]:font-medium [&>strong]:text-black",
        "after:-ml-1 after:content-['.']",
      )}
    >
      {objectTypeStr}
      {queryStr}
      {availabilityStr}
      {translationStr}
    </p>
  );
};
