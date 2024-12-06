import { useState } from "react";

import { DimensionMultiSelect } from "src/components/inputs/multiselect/dimensionMultiselect/dimensionMultiselect.component";
import { DisplayGraphQLQuery, SearchObjectsModal } from "src/components/modals";
import { ObjectIdentifierList } from "src/components/objectIdentifier";
import {
  HandleDropError,
  handleDroppedAudienceSegments,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelButton,
  PanelEmptyDataText,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { HREFS, OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useAvailabilityObjectDimensions } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useAvailabilityObjectSegments } from "src/hooks/availability/useAvailabilityObjectSegments";
import { useIsDragging } from "src/hooks/dnd/useIsDragging";
import { usePanelDropzone } from "src/hooks/dnd/usePanelDropzone";
import { PanelTab, SetPanelObject } from "src/hooks/state";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  ModifiedAvailabilityDimensions,
  ModifiedAudienceSegments,
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
    | BuiltInSkylarkObjectType.AudienceSegment
  >;
  inEditMode: boolean;
  setPanelObject: SetPanelObject;
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null;
  setAvailabilityDimensionValues: (m: ModifiedAvailabilityDimensions) => void;
  modifiedAudienceSegments: ModifiedAudienceSegments | null;
  setAudienceSegments: (
    m: ModifiedAudienceSegments,
    errors: HandleDropError[],
  ) => void;
}

const combineServerDimensionsAndModifiedDimensions = (
  dimensions: ParsedSkylarkDimensionWithValues[],
  dimensionsBreakdown: Record<string, string[]> | null | undefined,
  serverDimensions: SkylarkGraphQLAvailabilityDimensionWithValues[] | undefined,
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null,
  modifiedAudienceSegments: ModifiedAudienceSegments | null,
): Record<
  string,
  { activeValues: string[]; assignedValues: string[]; segmentValues: string[] }
> => {
  const mergedDimensionsBreakdown: Record<string, string[]> = dimensions.reduce(
    (acc, { slug: dimensionSlug }) => {
      const assigned = dimensionsBreakdown?.[dimensionSlug] || [];
      const added =
        modifiedAudienceSegments?.added.flatMap(
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
  modifiedAudienceSegments,
  setAudienceSegments,
}: Pick<
  PanelAudienceProps,
  | "object"
  | "setPanelObject"
  | "modifiedAudienceSegments"
  | "setAudienceSegments"
> & { dimensions: ParsedSkylarkDimensionWithValues[] }) => {
  const { objectType, uid } = object;

  const { objectOperations: objectMeta } = useSkylarkObjectOperations(
    BuiltInSkylarkObjectType.AudienceSegment,
  );

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
          .filter(({ uid }) => !modifiedAudienceSegments?.removed.includes(uid))
          .map(({ uid }) => uid);
        const addedUids =
          modifiedAudienceSegments?.added.map(({ uid }) => uid) || [];
        const { addedObjects, errors } = handleDroppedAudienceSegments({
          droppedObjects,
          existingUids: [...existingUids, ...addedUids],
          activeObjectUid: uid,
        });

        setAudienceSegments(
          {
            removed: modifiedAudienceSegments?.removed || [],
            added: [
              ...(modifiedAudienceSegments?.added || []),
              ...addedObjects,
            ],
          },
          errors,
        );
      }
    },
  });

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const objects = [
    ...(
      segments?.map((segment) =>
        createDefaultSkylarkObject({
          ...segment,
          objectType: BuiltInSkylarkObjectType.AudienceSegment,
          display: {
            name:
              segment.title ||
              segment.slug ||
              segment.external_id ||
              segment.uid,
          },
        }),
      ) || []
    ).filter(({ uid }) => !modifiedAudienceSegments?.removed.includes(uid)),
    ...(modifiedAudienceSegments?.added || []),
  ];

  return (
    <div className="relative">
      <div className="flex items-center">
        <PanelSectionTitle text={"Segments"} />
        {!isSegmentsLoading && (
          <PanelButton
            aria-label={`Open edit content modal`}
            type="plus"
            onClick={() => setModalIsOpen(true)}
          />
        )}
      </div>

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
          setAudienceSegments(
            {
              added: (modifiedAudienceSegments?.added || []).filter(
                ({ uid }) => uid !== o.uid,
              ),
              removed: [...(modifiedAudienceSegments?.removed || []), o.uid],
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
      {objectMeta && (
        <SearchObjectsModal
          title={`Add Audience Segment`}
          isOpen={modalIsOpen}
          existingObjects={objects}
          objectTypes={[
            BuiltInSkylarkObjectType.AudienceSegment,
            BuiltInSkylarkObjectType.AvailabilitySegment,
          ]}
          columns={[
            OBJECT_LIST_TABLE.columnIds.displayField,
            ...objectMeta.fields.map(({ name }) => name),
          ]}
          closeModal={() => setModalIsOpen(false)}
          onSave={({ checkedObjects }) => {
            const { addedObjects, errors } = handleDroppedAudienceSegments({
              droppedObjects: checkedObjects,
              activeObjectUid: uid,
              existingUids: objects.map(({ uid }) => uid) || [],
            });

            setAudienceSegments(
              {
                removed: modifiedAudienceSegments?.removed || [],
                added: [
                  ...(modifiedAudienceSegments?.added || []),
                  ...addedObjects,
                ],
              },
              errors,
            );
          }}
        />
      )}
    </div>
  );
};

const PanelAudienceDimensions = ({
  object,
  dimensions,
  modifiedAvailabilityDimensions,
  modifiedAudienceSegments,
  setAvailabilityDimensionValues,
}: Pick<
  PanelAudienceProps,
  | "object"
  | "modifiedAvailabilityDimensions"
  | "modifiedAudienceSegments"
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
    modifiedAudienceSegments,
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
    <div className="relative mt-4">
      <PanelSectionTitle text={"Dimensions"} />
      {dimensions.map((dimension) => {
        const selectedValues =
          combinedDimensions?.[dimension.slug]?.activeValues ||
          modifiedAvailabilityDimensions?.[dimension.slug]?.added ||
          [];
        const segmentValues =
          combinedDimensions?.[dimension.slug]?.segmentValues || [];

        return getObjectLoading ? (
          <>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          <DimensionMultiSelect
            key={`dimension-card-${dimension.uid}`}
            dimension={dimension}
            onChange={onChange}
            selected={selectedValues}
            segmentValues={segmentValues}
          />
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
            {objectType === BuiltInSkylarkObjectType.Availability && (
              <PanelAudienceSegments {...props} dimensions={dimensions} />
            )}
            <PanelAudienceDimensions {...props} dimensions={dimensions} />
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
