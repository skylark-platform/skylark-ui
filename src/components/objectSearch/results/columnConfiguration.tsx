import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import clsx from "clsx";
import { FiZap } from "react-icons/fi";

import { AvailabilityLabel } from "src/components/availability";
import { Checkbox } from "src/components/inputs/checkbox";
import { Pill } from "src/components/pill";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { PanelTab } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  ParsedSkylarkObjectAvailability,
  ParsedSkylarkObjectConfig,
} from "src/interfaces/skylark";
import { formatReadableDateTime } from "src/lib/skylark/availability";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import {
  addCloudinaryOnTheFlyImageTransformation,
  formatObjectField,
  getObjectDisplayName,
  hasProperty,
  isAvailabilityOrAudienceSegment,
} from "src/lib/utils";

import { Cell } from "./grids/cell.component";

export type ObjectSearchTableData = ParsedSkylarkObject &
  Record<string, string>;

export const OBJECT_SEARCH_HARDCODED_COLUMNS = [
  OBJECT_LIST_TABLE.columnIds.displayField,
  OBJECT_LIST_TABLE.columnIds.objectType,
  OBJECT_LIST_TABLE.columnIds.translation,
  OBJECT_LIST_TABLE.columnIds.availability,
  OBJECT_LIST_TABLE.columnIds.images,
  OBJECT_LIST_TABLE.columnIds.dateCreated,
  OBJECT_LIST_TABLE.columnIds.dateModified,
  OBJECT_LIST_TABLE.columnIds.languageVersion,
  OBJECT_LIST_TABLE.columnIds.globalVersion,
];

export const OBJECT_SEARCH_ORDERED_KEYS = [
  "uid",
  "external_id",
  "data_source_id",
  "type",
];

export const OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS = [
  OBJECT_LIST_TABLE.columnIds.dragIcon,
  OBJECT_LIST_TABLE.columnIds.checkbox,
];

export const MAX_FROZEN_COLUMNS = 4;

export const columnsWithoutResize = [
  OBJECT_LIST_TABLE.columnIds.dragIcon,
  OBJECT_LIST_TABLE.columnIds.checkbox,
];

const columnHelper = createColumnHelper<ObjectSearchTableData>();

// Issues with Safari means its safe to allow the drag icon have it's own column than use a pseudo field
const dragIconColumn = columnHelper.display({
  id: OBJECT_LIST_TABLE.columnIds.dragIcon,
  header: "",
  size: 25,
  maxSize: 25,
  cell: ({ cell, row, table }) => {
    const tableMeta = table.options.meta;
    const isHoveredRow = tableMeta?.hoveredRow === row.index;

    const original = row.original;
    const cellContext = cell.getContext();

    const { config }: { config: ParsedSkylarkObjectConfig | null } =
      cellContext.table.options.meta?.objectTypesWithConfig?.find(
        ({ objectType }) => objectType === original.objectType,
      ) || { config: null };

    const hideObjectTypeIndicator = table
      .getLeftVisibleLeafColumns()
      .find(({ id }) => id === OBJECT_LIST_TABLE.columnIds.objectType);

    return tableMeta?.activeObject && isHoveredRow ? (
      <span className="block h-full w-5 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat opacity-60" />
    ) : !hideObjectTypeIndicator ? (
      <div className="flex h-full items-center justify-center">
        <div
          className={clsx(
            "h-2 w-2",
            isAvailabilityOrAudienceSegment(original.objectType)
              ? "rounded-sm bg-brand-primary"
              : "rounded-full bg-manatee-300",
          )}
          style={{ background: config?.colour || undefined }}
        />
      </div>
    ) : (
      <></>
    );
  },
});

const objectTypeColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.objectType,
  {
    id: OBJECT_LIST_TABLE.columnIds.objectType,
    header: formatObjectField("Object type"),
    size: 120,
    minSize: 60,
    cell: ({ cell, row }) => {
      const object = row.original as ParsedSkylarkObject;
      const cellContext = cell.getContext();

      const { config }: { config: ParsedSkylarkObjectConfig | null } =
        cellContext.table.options.meta?.objectTypesWithConfig?.find(
          ({ objectType }) => objectType === object.objectType,
        ) || { config: null };

      return (
        <div className="flex h-full w-full items-center pr-0.5">
          <Pill
            Icon={object.meta.hasDynamicContent ? FiZap : undefined}
            label={config?.objectTypeDisplayName || object.objectType}
            bgColor={config?.colour || undefined}
            className="w-full"
          />
        </div>
      );
    },
  },
);

const displayNameColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.displayField,
  {
    id: OBJECT_LIST_TABLE.columnIds.displayField,
    header: formatObjectField("Display Field"),
    size: 280,
    minSize: 100,
    cell: (props) => <>{props.cell.getValue() as string}</>,
  },
);

const translationColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.translation,
  {
    id: OBJECT_LIST_TABLE.columnIds.translation,
    header: formatObjectField("Translation"),
    size: 120,
    minSize: 80,
    cell: (props) => <>{props.cell.getValue() as string}</>,
  },
);

const availabilityColumn = columnHelper.accessor("meta.availabilityStatus", {
  id: OBJECT_LIST_TABLE.columnIds.availability,
  header: formatObjectField("Availability"),
  size: 150,
  minSize: 35,
  cell: ({
    getValue,
    table: {
      options: { meta: tableMeta },
    },
    row: { original: object },
  }) => {
    const status = getValue<ParsedSkylarkObjectAvailability["status"]>();
    return (
      status && (
        <AvailabilityLabel
          status={status}
          as="button"
          onClick={(e) => {
            if (tableMeta?.onObjectClick) {
              e.stopPropagation();
              tableMeta.onObjectClick(convertParsedObjectToIdentifier(object), {
                tab: PanelTab.Availability,
                parsedObject: object,
              });
            }
          }}
        />
      )
    );
  },
});

const dateCreated = columnHelper.accessor("meta.created", {
  id: OBJECT_LIST_TABLE.columnIds.dateCreated,
  header: formatObjectField("Date added"),
  size: 200,
  minSize: 100,
  cell: ({ getValue }) => {
    const value = getValue();
    return <>{value ? formatReadableDateTime(value) : null}</>;
  },
});

const dateModified = columnHelper.accessor("meta.modified", {
  id: OBJECT_LIST_TABLE.columnIds.dateModified,
  header: formatObjectField("Date modified"),
  size: 200,
  minSize: 100,
  cell: ({ getValue }) => {
    const value = getValue();
    return <>{value ? formatReadableDateTime(value) : null}</>;
  },
});

const languageVersion = columnHelper.accessor("meta.versions.language", {
  id: OBJECT_LIST_TABLE.columnIds.languageVersion,
  header: formatObjectField("Language Version"),
  size: 150,
  minSize: 80,
  cell: ({ getValue }) => {
    const value = getValue();
    return <>{value}</>;
  },
});

const globalVersion = columnHelper.accessor("meta.versions.global", {
  id: OBJECT_LIST_TABLE.columnIds.globalVersion,
  header: formatObjectField("Global Version"),
  size: 150,
  minSize: 80,
  cell: ({ getValue }) => {
    const value = getValue();
    return <>{value}</>;
  },
});

const imagesColumn = columnHelper.accessor(OBJECT_LIST_TABLE.columnIds.images, {
  id: OBJECT_LIST_TABLE.columnIds.images,
  header: formatObjectField("Images"),
  size: 100,
  minSize: 80,
  cell: (props) => {
    const imageRelationships = props.getValue<ParsedSkylarkObject["images"]>();
    const imageObj = props.row.original as ParsedSkylarkObject;

    const cloudinaryConfig = { height: 50 };
    const wrapperClassName = "items-center flex h-full py-1 overflow-hidden";
    const className = "object-cover object-left pr-0.5 h-full";

    if (
      imageObj.objectType === BuiltInSkylarkObjectType.SkylarkImage &&
      hasProperty(imageObj, "url")
    ) {
      return (
        <div className={wrapperClassName}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={className}
            src={addCloudinaryOnTheFlyImageTransformation(
              imageObj.url as string,
              cloudinaryConfig,
            )}
            key={`${props.row.id}-${imageObj.uid}`}
            alt={getObjectDisplayName(imageObj)}
          />
        </div>
      );
    }

    const allImages =
      imageRelationships
        ?.flatMap(({ objects }) => objects)
        .filter((obj) => obj) || [];

    if (allImages.length === 0) {
      return "";
    }

    return (
      <div className={wrapperClassName}>
        {allImages.map((image) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${props.row.id}-${image.uid}`}
            onClick={(e) => {
              if (props.table.options.meta?.onObjectClick) {
                e.stopPropagation();
                props.table.options.meta.onObjectClick(
                  convertParsedObjectToIdentifier(
                    parseSkylarkObject({
                      ...image,
                      __typename: BuiltInSkylarkObjectType.SkylarkImage,
                    }),
                  ),
                  {
                    parsedObject: parseSkylarkObject({
                      ...image,
                      __typename: BuiltInSkylarkObjectType.SkylarkImage,
                    }),
                  },
                );
              }
            }}
            className={className}
            src={addCloudinaryOnTheFlyImageTransformation(
              image.url,
              cloudinaryConfig,
            )}
            alt={image.title || image.slug}
          />
        ))}
      </div>
    );
  },
});

const selectColumn = columnHelper.display({
  id: OBJECT_LIST_TABLE.columnIds.checkbox,
  size: 28,
  minSize: 28,
  maxSize: 28,
  header: ({
    table: {
      options: { meta: tableMeta },
    },
  }) =>
    tableMeta?.checkedObjectsState &&
    tableMeta.checkedObjectsState.some(
      ({ checkedState }) => checkedState === true,
    ) && (
      <Checkbox
        aria-label="clear-all-checked-objects"
        checked="indeterminate"
        onClick={() => tableMeta.batchCheckRows("clear-all")}
      />
    ),
  cell: ({ cell, table, row }) => {
    const tableMeta = table.options.meta;
    const checked = row.getIsSelected();

    return (
      <Checkbox
        checked={checked}
        disabled={!row.getCanSelect()}
        // Not using onCheckChanged so that we have access to the native click event
        onClick={(e) => {
          e.stopPropagation();
          if (e.shiftKey) {
            tableMeta?.batchCheckRows("shift", cell.row.index);
          } else {
            tableMeta?.onRowCheckChange?.({
              checkedState: !checked,
              rowData: cell.row.original,
            });
          }
        }}
      />
    );
  },
});

export const createObjectListingColumns = (
  columns: string[],
  opts: { withObjectSelect?: boolean; withPanel: boolean },
): ColumnDef<ObjectSearchTableData, ObjectSearchTableData>[] => {
  const createdColumns = columns
    .filter((column) => !OBJECT_SEARCH_HARDCODED_COLUMNS.includes(column))
    .map((column) =>
      columnHelper.accessor(column, {
        id: column,
        header: formatObjectField(column),
        size: 200,
        minSize: 100,
        cell: ({ cell, table, row: { original: object } }) => {
          const allObjectsMeta = table.options.meta?.objectsMeta;
          const value = cell.getValue();

          if (allObjectsMeta) {
            const objectMeta = allObjectsMeta?.find(
              ({ name }) => name === object.objectType,
            );
            const normalisedField =
              objectMeta?.operations.create.inputs.find(
                ({ name }) => name === column,
              ) || objectMeta?.fields.find(({ name }) => name === column);

            if (normalisedField) {
              return (
                <Cell
                  field={normalisedField}
                  columnId={column}
                  objectType={object.objectType}
                  value={value}
                />
              );
            }
          }

          return <>{value}</>;
        },
      }),
    );

  const orderedColumnArray = [
    objectTypeColumn,
    displayNameColumn,
    translationColumn,
    imagesColumn,
    availabilityColumn,
    ...createdColumns,
    dateCreated,
    dateModified,
    languageVersion,
    globalVersion,
  ];

  if (opts.withObjectSelect) {
    // TODO eventually remove this option and rename dragIconColumn once the design is finalised
    // if (opts.withPanel) {
    //   return [dragIconColumn, selectColumn, ...orderedColumnArray] as ColumnDef<
    //     ParsedSkylarkObject,
    //     ParsedSkylarkObject
    //   >[];
    // }
    return [dragIconColumn, selectColumn, ...orderedColumnArray] as ColumnDef<
      ObjectSearchTableData,
      ObjectSearchTableData
    >[];
  }

  return orderedColumnArray as ColumnDef<
    ObjectSearchTableData,
    ObjectSearchTableData
  >[];
};
