import {
  MultiSelect,
  MultiSelectOption,
} from "src/components/inputs/multiselect/multiselect.component";
import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierList } from "src/components/objectIdentifier";
import {
  HandleDropError,
  handleDroppedAvailabilitySegments,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { HREFS } from "src/constants/skylark";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useAvailabilityObjectDimensions } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useAvailabilityObjectSegments } from "src/hooks/availability/useAvailabilityObjectSegments";
import { useIsDragging } from "src/hooks/dnd/useIsDragging";
import { usePanelDropzone } from "src/hooks/dnd/usePanelDropzone";
import { PanelTab, SetPanelObject } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  ModifiedAvailabilityDimensions,
  ModifiedAvailabilitySegments,
  ParsedSkylarkDimensionWithValues,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  SkylarkObject,
} from "src/interfaces/skylark";
import { DragType, DroppableType } from "src/lib/dndkit/dndkit";
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
  setAvailabilitySegments: (
    m: ModifiedAvailabilitySegments,
    errors: HandleDropError[],
  ) => void;
}

const combineServerDimensionsAndModifiedDimensions = (
  dimensions: ParsedSkylarkDimensionWithValues[],
  dimensionsBreakdown: Record<string, string[]> | null | undefined,
  serverDimensions: SkylarkGraphQLAvailabilityDimensionWithValues[] | undefined,
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null,
  modifiedAvailabilitySegments: ModifiedAvailabilitySegments | null,
): Record<
  string,
  { activeValues: string[]; assignedValues: string[]; segmentValues: string[] }
> => {
  const mergedDimensionsBreakdown: Record<string, string[]> = dimensions.reduce(
    (acc, { slug: dimensionSlug }) => {
      const assigned = dimensionsBreakdown?.[dimensionSlug] || [];
      const added =
        modifiedAvailabilitySegments?.added.flatMap(
          (segment) =>
            segment.contextualFields?.dimensions?.[dimensionSlug] || [],
        ) || [];
      return {
        ...acc,
        [dimensionSlug]: [...new Set([...assigned, ...added])],
      };
    },
    {},
  );

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
        mergedDimensionsBreakdown?.[dimensionSlug] || assignedValues || [];

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
  modifiedAvailabilitySegments,
  setAvailabilitySegments,
}: Pick<
  PanelAudienceProps,
  | "object"
  | "setPanelObject"
  | "modifiedAvailabilitySegments"
  | "setAvailabilitySegments"
> & { dimensions: ParsedSkylarkDimensionWithValues[] }) => {
  const { objectType, uid } = object;

  const {
    segments,
    query,
    variables,
    isLoading: isSegmentsLoading,
  } = useAvailabilityObjectSegments(objectType, uid);

  usePanelDropzone(DroppableType.PANEL_GENERIC, {
    onObjectsDropped: (droppedObjects) => {
      if (droppedObjects && droppedObjects.length > 0) {
        const existingUids = (segments || [])
          .filter(
            ({ uid }) => !modifiedAvailabilitySegments?.removed.includes(uid),
          )
          .map(({ uid }) => uid);
        const addedUids =
          modifiedAvailabilitySegments?.added.map(({ uid }) => uid) || [];
        const { addedObjects, errors } = handleDroppedAvailabilitySegments({
          droppedObjects,
          existingUids: [...existingUids, ...addedUids],
          activeObjectUid: uid,
        });

        setAvailabilitySegments(
          {
            removed: modifiedAvailabilitySegments?.removed || [],
            added: [
              ...(modifiedAvailabilitySegments?.added || []),
              ...addedObjects,
            ],
          },
          errors,
        );
      }
    },
  });

  const objects = [
    ...(
      segments?.map((segment) =>
        createDefaultSkylarkObject({
          ...segment,
          objectType: BuiltInSkylarkObjectType.AvailabilitySegment,
          display: {
            name:
              segment.title ||
              segment.slug ||
              segment.external_id ||
              segment.uid,
          },
        }),
      ) || []
    ).filter(({ uid }) => !modifiedAvailabilitySegments?.removed.includes(uid)),
    ...(modifiedAvailabilitySegments?.added || []),
  ];

  return (
    <div className="relative">
      <PanelSectionTitle text={"Segments"} />

      <ObjectIdentifierList
        objects={objects}
        hideAvailabilityStatus
        hideObjectType
        setPanelObject={(object, opts) =>
          setPanelObject(object, {
            ...opts,
            tab: PanelTab.AvailabilityAudience,
          })
        }
        onDeleteClick={(o) => {
          setAvailabilitySegments(
            {
              added: (modifiedAvailabilitySegments?.added || []).filter(
                ({ uid }) => uid !== o.uid,
              ),
              removed: [
                ...(modifiedAvailabilitySegments?.removed || []),
                o.uid,
              ],
            },
            [],
          );
        }}
      />
      {objects.length === 0 && !isSegmentsLoading && <PanelEmptyDataText />}
      <PanelLoading isLoading={isSegmentsLoading}>
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton
            key={`content-skeleton-${i}`}
            className="mb-2 h-11 w-full max-w-xl"
          />
        ))}
      </PanelLoading>

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
  modifiedAvailabilitySegments,
  setAvailabilityDimensionValues,
}: Pick<
  PanelAudienceProps,
  | "object"
  | "modifiedAvailabilityDimensions"
  | "modifiedAvailabilitySegments"
  | "setAvailabilityDimensionValues"
> & { dimensions: ParsedSkylarkDimensionWithValues[] }) => {
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
    modifiedAvailabilitySegments,
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

  const [showDropZone] = useIsDragging(DragType.CONTENT_LIBRARY_OBJECT);

  return (
    <PanelSectionLayout
      sections={(dimensions || []).map(({ uid, title, slug }) => ({
        htmlId: `dimensions-panel-${uid}`,
        id: uid,
        title: formatObjectField(title || slug),
      }))}
      isPage={isPage}
    >
      {showDropZone && (
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white z-50">
          <PanelDropZone />
        </div>
      )}
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
