import { useEffect, useState } from "react";

import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { SelectOption, Select } from "src/components/inputs/select";
import { PanelLoading } from "src/components/panel/panelLoading";
import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useAvailabilityObjectDimensions } from "src/hooks/availability/useAvailabilityObjectDimensions";
import {
  SkylarkGraphQLAvailabilityDimensionWithValues,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField, isObjectsDeepEqual } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  inEditMode: boolean;
  availabilityDimensionValues: Record<string, string[]> | null;
  setAvailabilityDimensionValues: (
    o: {
      original: Record<string, string[]>;
      updated: Record<string, string[]>;
    },
    toggleEditMode: boolean,
  ) => void;
}

const parseDimensionsAndValues = (
  data: SkylarkGraphQLAvailabilityDimensionWithValues[],
) => {
  // Dimensions use slugs not uids
  const entries = data.map((dimension): [string, string[]] => {
    const valueSlugs = dimension.values.objects.map(({ slug }) => slug);
    return [dimension.slug, valueSlugs];
  });
  const selectedDimensionValues = Object.fromEntries(entries);
  return selectedDimensionValues;
};

export const PanelAvailabilityDimensions = ({
  isPage,
  inEditMode,
  uid,
  availabilityDimensionValues,
  setAvailabilityDimensionValues,
}: PanelRelationshipsProps) => {
  const { dimensions, isLoading: dimensionsLoading } =
    useAvailabilityDimensionsWithValues();
  const {
    data,
    query,
    variables,
    isLoading: getObjectLoading,
  } = useAvailabilityObjectDimensions(uid);

  const isLoading =
    dimensionsLoading || getObjectLoading || !availabilityDimensionValues;

  useEffect(() => {
    if (data && !inEditMode) {
      const selectedDimensionValues = parseDimensionsAndValues(data);
      const selectedValuesAreSame =
        availabilityDimensionValues !== null &&
        isObjectsDeepEqual(
          selectedDimensionValues,
          availabilityDimensionValues,
        );

      if (!selectedValuesAreSame) {
        setAvailabilityDimensionValues(
          {
            original: selectedDimensionValues,
            updated: selectedDimensionValues,
          },
          false,
        );
      }
    }
  }, [
    data,
    inEditMode,
    availabilityDimensionValues,
    setAvailabilityDimensionValues,
  ]);

  console.log({ availabilityDimensionValues });

  return (
    <PanelSectionLayout
      sections={(dimensions || []).map(({ uid, title, slug }) => ({
        id: `dimensions-panel-${uid}`,
        title: formatObjectField(title || slug),
      }))}
      isPage={isPage}
    >
      {!isLoading &&
        dimensions?.map((dimension) => {
          const options: SelectOption[] = dimension.values
            .map(
              (value): SelectOption => ({
                label: value.title || value.slug,
                value: value.slug,
              }),
            )
            .sort();
          const title = formatObjectField(dimension.title || dimension.slug);

          const onChangeWrapper = (updatedSelectedValues: string[]) => {
            setAvailabilityDimensionValues(
              {
                original: data ? parseDimensionsAndValues(data) : {},
                updated: {
                  ...availabilityDimensionValues,
                  [dimension.slug]: updatedSelectedValues,
                },
              },
              true,
            );
          };

          const values = availabilityDimensionValues
            ? availabilityDimensionValues[dimension.slug]
            : [];

          return (
            <div key={dimension.uid} className="mb-6">
              <PanelFieldTitle
                text={title}
                id={`dimensions-panel-${dimension.uid}`}
              />
              <MultiSelect
                options={options}
                selected={values}
                onChange={onChangeWrapper}
              />
            </div>
          );
        })}
      <PanelLoading isLoading={isLoading} />
      <DisplayGraphQLQuery
        label="Get Dimensions"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
      {inEditMode && (
        <p className="w-full py-4 text-center text-sm text-manatee-600">
          {"Drag an object from the Content Library to add as relationship"}
        </p>
      )}
    </PanelSectionLayout>
  );
};
