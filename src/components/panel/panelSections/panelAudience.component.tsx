import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { SelectOption } from "src/components/inputs/select";
import { DisplayGraphQLQuery } from "src/components/modals";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { HREFS } from "src/constants/skylark";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { useAvailabilityObjectDimensions } from "src/hooks/availability/useAvailabilityObjectDimensions";
import {
  BuiltInSkylarkObjectType,
  ModifiedAvailabilityDimensions,
  ParsedSkylarkDimensionsWithValues,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAudienceProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  inEditMode: boolean;
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null;
  setAvailabilityDimensionValues: (m: ModifiedAvailabilityDimensions) => void;
}

const combineServerDimensionsAndModifiedDimensions = (
  serverDimensions: SkylarkGraphQLAvailabilityDimensionWithValues[] | undefined,
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null,
): Record<string, string[]> => {
  if (!serverDimensions) {
    return {};
  }

  // Dimensions use slugs not uids
  const entries = serverDimensions.map((dimension): [string, string[]] => {
    const modifiedDimension =
      modifiedAvailabilityDimensions?.[dimension.slug] || null;

    if (!modifiedAvailabilityDimensions || !modifiedDimension) {
      const valueSlugs = dimension.values.objects.map(({ slug }) => slug);
      return [dimension.slug, valueSlugs];
    }

    const valueSlugs = [
      ...dimension.values.objects.map(({ slug }) => slug),
      ...modifiedDimension.added,
    ].filter((slug) => !modifiedDimension.removed.includes(slug));

    return [dimension.slug, valueSlugs];
  });

  const selectedDimensionValues = Object.fromEntries(entries);
  return selectedDimensionValues;
};

const PanelAudienceSegments = () => {
  return <></>;
};

const PanelAudienceDimensions = ({
  objectType,
  uid,
  dimensions,
  modifiedAvailabilityDimensions,
  setAvailabilityDimensionValues,
}: Pick<
  PanelAudienceProps,
  | "uid"
  | "objectType"
  | "modifiedAvailabilityDimensions"
  | "setAvailabilityDimensionValues"
> & { dimensions: ParsedSkylarkDimensionsWithValues[] }) => {
  const {
    data,
    query,
    variables,
    isLoading: getObjectLoading,
  } = useAvailabilityObjectDimensions(objectType, uid);

  const combinedDimensions = combineServerDimensionsAndModifiedDimensions(
    data,
    modifiedAvailabilityDimensions,
  );

  const onChange = (dimensionSlug: string, values: string[]) => {
    const serverValues =
      data
        ?.find(({ slug }) => dimensionSlug === slug)
        ?.values.objects.map(({ slug }) => slug) || [];

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
        const options: SelectOption<string>[] = dimension.values
          .map(
            (value): SelectOption<string> => ({
              label: value.title || value.slug,
              value: value.slug,
            }),
          )
          .sort();

        const onChangeWrapper = (updatedSelectedValues: string[]) => {
          onChange(dimension.slug, updatedSelectedValues);
        };

        const values =
          combinedDimensions?.[dimension.slug] ||
          modifiedAvailabilityDimensions?.[dimension.slug].added ||
          [];

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
                selected={values}
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

  const { isPage, objectType } = props;

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
            {objectType === BuiltInSkylarkObjectType.Availability && (
              <PanelAudienceSegments />
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
