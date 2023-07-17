import { useEffect } from "react";

import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { SelectOption } from "src/components/inputs/select";
import { DisplayGraphQLQuery } from "src/components/modals";
import { PanelLoading } from "src/components/panel/panelLoading";
import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
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
): Record<string, string[]> => {
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

  return (
    <PanelSectionLayout
      sections={(dimensions || []).map(({ uid, title, slug }) => ({
        id: `dimensions-panel-${uid}`,
        title: formatObjectField(title || slug),
      }))}
      isPage={isPage}
    >
      {!dimensionsLoading &&
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
            <div key={`dimension-card-${dimension.uid}`} className="mb-6">
              <PanelFieldTitle
                text={title}
                id={`dimensions-panel-${dimension.uid}`}
              />
              {getObjectLoading || !availabilityDimensionValues ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <MultiSelect
                  options={options}
                  selected={values}
                  onChange={onChangeWrapper}
                />
              )}
            </div>
          );
        })}
      <PanelLoading isLoading={dimensionsLoading}>
        <Skeleton className="mb-2 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="mb-2 mt-6 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="mb-2 mt-6 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
      </PanelLoading>
      <DisplayGraphQLQuery
        label="Get Dimensions"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
    </PanelSectionLayout>
  );
};
