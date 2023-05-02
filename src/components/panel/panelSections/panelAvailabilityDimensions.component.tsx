import { useEffect, useState } from "react";

import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { SelectOption, Select } from "src/components/inputs/select";
import { PanelLoading } from "src/components/panel/panelLoading";
import { PanelFieldTitle } from "src/components/panel/panelTypography";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useAvailabilityObjectDimensions } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useGetObjectAvailability } from "src/hooks/useGetObjectAvailability";
import { SkylarkObjectType } from "src/interfaces/skylark";
import { formatObjectField, isObjectsDeepEqual } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  inEditMode: boolean;
}

export const PanelAvailabilityDimensions = ({
  isPage,
  inEditMode,
  objectType,
  uid,
}: PanelRelationshipsProps) => {
  const { dimensions, isLoading: dimensionsLoading } =
    useAvailabilityDimensionsWithValues();
  const {
    data,
    query,
    variables,
    isLoading: getObjectLoading,
  } = useAvailabilityObjectDimensions(uid);

  const isLoading = dimensionsLoading || getObjectLoading;

  const [updatedDimensionValues, setUpdatedDimensionValues] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    if (data && !inEditMode) {
      const entries = data.map((dimension): [string, string[]] => {
        const valueUids = dimension.values.objects.map(({ uid }) => uid);
        return [dimension.uid, valueUids];
      });
      const selectedDimensionValues = Object.fromEntries(entries);

      const selectedValuesHaveChanged = isObjectsDeepEqual(
        selectedDimensionValues,
        updatedDimensionValues,
      );
      if (selectedValuesHaveChanged) {
        setUpdatedDimensionValues(selectedDimensionValues);
      }
    }
  }, [data, inEditMode, updatedDimensionValues]);

  return (
    <PanelSectionLayout
      sections={(dimensions || []).map(({ uid, title, external_id, slug }) => ({
        id: `dimensions-panel-${uid}`,
        title: formatObjectField(title || slug || external_id || uid),
      }))}
      isPage={isPage}
    >
      {!isLoading &&
        dimensions?.map((dimension) => {
          const options: SelectOption[] = dimension.values
            .map(
              (value): SelectOption => ({
                label:
                  value.title || value.slug || value.external_id || value.uid,
                value: value.uid,
              }),
            )
            .sort();
          const title =
            formatObjectField(
              dimension.title || dimension.slug || dimension.external_id || "",
            ) || dimension.uid;

          const onChangeWrapper = (updatedSelectedValues: string[]) => {
            setUpdatedDimensionValues({
              ...updatedDimensionValues,
              [dimension.uid]: updatedSelectedValues,
            });
          };

          return (
            <div key={dimension.uid} className="mb-6">
              <PanelFieldTitle
                text={title}
                id={`dimensions-panel-${dimension.uid}`}
              />
              <MultiSelect
                options={options}
                placeholder={title}
                selected={updatedDimensionValues[dimension.uid]}
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
