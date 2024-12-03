import { SkylarkObjectFieldInput } from "src/components/inputs";
import {
  MultiSelect,
  MultiSelectOption,
} from "src/components/inputs/multiselect/multiselect.component";
import { SelectOption } from "src/components/inputs/select";
import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierList } from "src/components/objectIdentifier";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { HREFS } from "src/constants/skylark";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useAvailabilityObjectDimensions } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useAvailabilityObjectSegments } from "src/hooks/availability/useAvailabilityObjectSegments";
import { SetPanelObject } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  ModifiedAvailabilityDimensions,
  ModifiedAvailabilitySegments,
  ParsedSkylarkDimensionsWithValues,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  SkylarkObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { createDefaultSkylarkObject } from "src/lib/skylark/objects";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAudienceProps {
  isPage?: boolean;
  object: SkylarkObject<
    | BuiltInSkylarkObjectType.Availability
    | BuiltInSkylarkObjectType.AvailabilitySegment
  >;
  inEditMode: boolean;
  setPanelObject: SetPanelObject;
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null;
  setAvailabilityDimensionValues: (m: ModifiedAvailabilityDimensions) => void;
  modifiedAvailabilitySegments: ModifiedAvailabilitySegments | null;
  setAvailabilitySegments: (m: ModifiedAvailabilitySegments) => void;
}

const combineServerDimensionsAndModifiedDimensions = (
  dimensions: ParsedSkylarkDimensionsWithValues[],
  dimensionsBreakdown: Record<string, string[]> | null | undefined,
  serverDimensions: SkylarkGraphQLAvailabilityDimensionWithValues[] | undefined,
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null,
): Record<
  string,
  { activeValues: string[]; assignedValues: string[]; segmentValues: string[] }
> => {
  if (!serverDimensions) {
    return {};
  }

  // Dimensions use slugs not uids
  const entries = dimensions.map(
    ({
      slug: dimensionSlug,
    }): [
      string,
      {
        activeValues: string[];
        assignedValues: string[];
        segmentValues: string[];
      },
    ] => {
      const assignedValues =
        serverDimensions
          .find(({ slug }) => slug === dimensionSlug)
          ?.values.objects.map(({ slug }) => slug) || [];
      const allActiveValues =
        dimensionsBreakdown?.[dimensionSlug] || assignedValues || [];

      const segmentValues = allActiveValues.filter(
        (val) => !assignedValues.includes(val),
      );

      const modifiedDimension =
        modifiedAvailabilityDimensions?.[dimensionSlug] || null;

      if (!modifiedAvailabilityDimensions || !modifiedDimension) {
        return [
          dimensionSlug,
          { activeValues: allActiveValues, assignedValues, segmentValues },
        ];
      }

      const valueSlugs = [
        ...allActiveValues,
        ...modifiedDimension.added,
      ].filter((slug) => !modifiedDimension.removed.includes(slug));

      return [
        dimensionSlug,
        {
          activeValues: valueSlugs,
          assignedValues,
          segmentValues,
        },
      ];
    },
  );

  const selectedDimensionValues = Object.fromEntries(entries);
  return selectedDimensionValues;
};

const PanelAudienceSegments = ({
  object,
  dimensions,
  setPanelObject,
}: Pick<
  PanelAudienceProps,
  | "object"
  | "setPanelObject"
  | "modifiedAvailabilitySegments"
  | "setAvailabilitySegments"
> & { dimensions: ParsedSkylarkDimensionsWithValues[] }) => {
  const { objectType, uid } = object;

  const {
    segments,
    query,
    variables,
    isLoading: getObjectLoading,
  } = useAvailabilityObjectSegments(objectType, uid);

  const objects =
    segments?.map((segment) =>
      createDefaultSkylarkObject({
        ...segment,
        objectType: BuiltInSkylarkObjectType.AvailabilitySegment,
        display: {
          name:
            segment.title || segment.slug || segment.external_id || segment.uid,
        },
      }),
    ) || [];

  return (
    <div className="relative">
      <PanelSectionTitle text={"Segments"} />

      <ObjectIdentifierList
        objects={objects}
        hideAvailabilityStatus
        hideObjectType
        setPanelObject={setPanelObject}
      />

      <DisplayGraphQLQuery
        label={`Get ${objectType} Segments`}
        query={query}
        variables={variables}
        buttonClassName="absolute right-0 -top-2"
      />
    </div>
  );
};

const PanelAudienceDimensions = ({
  object,
  dimensions,
  modifiedAvailabilityDimensions,
  setAvailabilityDimensionValues,
}: Pick<
  PanelAudienceProps,
  "object" | "modifiedAvailabilityDimensions" | "setAvailabilityDimensionValues"
> & { dimensions: ParsedSkylarkDimensionsWithValues[] }) => {
  const { objectType, uid } = object;

  const {
    data,
    query,
    variables,
    isLoading: getObjectLoading,
  } = useAvailabilityObjectDimensions(objectType, uid);

  const combinedDimensions = combineServerDimensionsAndModifiedDimensions(
    dimensions,
    object.contextualFields?.dimensions,
    data,
    modifiedAvailabilityDimensions,
  );

  const onChange = (dimensionSlug: string, values: string[]) => {
    const serverValues =
      object.contextualFields?.dimensions?.[dimensionSlug] ||
      data
        ?.find(({ slug }) => dimensionSlug === slug)
        ?.values.objects.map(({ slug }) => slug) ||
      [];

    const addedValues = values.filter((slug) => !serverValues.includes(slug));
    const removedValues = serverValues.filter((slug) => !values.includes(slug));

    const updatedModified: ModifiedAvailabilityDimensions[""] = {
      added: addedValues,
      removed: removedValues,
    };

    setAvailabilityDimensionValues({
      ...modifiedAvailabilityDimensions,
      [dimensionSlug]: updatedModified,
    });
  };

  return (
    <div className="relative">
      <PanelSectionTitle text={"Dimensions"} />
      {dimensions.map((dimension) => {
        const title = formatObjectField(dimension.title || dimension.slug);

        const selectedValues =
          combinedDimensions?.[dimension.slug]?.activeValues ||
          modifiedAvailabilityDimensions?.[dimension.slug]?.added ||
          [];
        const segmentValues =
          combinedDimensions?.[dimension.slug]?.segmentValues || [];

        const options: MultiSelectOption[] = dimension.values
          .map((value): MultiSelectOption => {
            const isInheritedFromSegment = segmentValues.includes(value.slug);

            return {
              label: value.title || value.slug,
              value: value.slug,
              infoTooltip:
                isInheritedFromSegment &&
                "Inherited from an AvailabilitySegment",
              disabled: isInheritedFromSegment,
            };
          })
          .sort();

        const onChangeWrapper = (updatedSelectedValues: string[]) => {
          onChange(dimension.slug, updatedSelectedValues);
        };

        return (
          <div key={`dimension-card-${dimension.uid}`} className="mb-6">
            <PanelFieldTitle
              text={title}
              id={`dimensions-panel-${dimension.uid}`}
            />
            {getObjectLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <MultiSelect
                renderInPortal
                options={options}
                selected={selectedValues}
                onChange={onChangeWrapper}
              />
            )}
          </div>
        );
      })}

      <DisplayGraphQLQuery
        label={`Get ${objectType} Dimensions`}
        query={query}
        variables={variables}
        buttonClassName="absolute right-0 -top-2"
      />
    </div>
  );
};

export const PanelAudience = (props: PanelAudienceProps) => {
  const { dimensions, isLoading: dimensionsLoading } =
    useAvailabilityDimensionsWithValues();

  const {
    isPage,
    object: { objectType },
  } = props;

  return (
    <PanelSectionLayout
      sections={(dimensions || []).map(({ uid, title, slug }) => ({
        htmlId: `dimensions-panel-${uid}`,
        id: uid,
        title: formatObjectField(title || slug),
      }))}
      isPage={isPage}
    >
      {!dimensionsLoading &&
        dimensions &&
        (dimensions.length === 0 ? (
          <>
            <p>No Dimensions configured for Account.</p>
            <a
              className="my-2 block text-brand-primary underline"
              href={HREFS.apiDocs.dimensions}
              target="_blank"
              rel="noreferrer"
            >
              Learn more.
            </a>
          </>
        ) : (
          <>
            <PanelAudienceDimensions {...props} dimensions={dimensions} />
            {objectType === BuiltInSkylarkObjectType.Availability && (
              <PanelAudienceSegments {...props} dimensions={dimensions} />
            )}
          </>
        ))}
      <PanelLoading isLoading={dimensionsLoading}>
        <Skeleton className="mb-2 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="mb-2 mt-6 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="mb-2 mt-6 h-5 w-48" />
        <Skeleton className="h-20 w-full" />
      </PanelLoading>
    </PanelSectionLayout>
  );
};
