import {
  ColumnDef,
  Table,
  createColumnHelper,
  Cell as ReactTableCell,
} from "@tanstack/react-table";

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
  ParsedSkylarkObjectImageRelationship,
} from "src/interfaces/skylark";
import { formatReadableDateTime } from "src/lib/skylark/availability";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import {
  addCloudinaryOnTheFlyImageTransformation,
  formatObjectField,
  getObjectDisplayName,
  hasProperty,
} from "src/lib/utils";

import { Cell } from "./grids/cell.component";

type ObjectSearchTableData = ParsedSkylarkObject & Record<string, string>;

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
  OBJECT_LIST_TABLE.columnIds.objectTypeIndicator,
];

export const MAX_FROZEN_COLUMNS = 4;

export const columnsWithoutResize = [
  OBJECT_LIST_TABLE.columnIds.dragIcon,
  OBJECT_LIST_TABLE.columnIds.checkbox,
  OBJECT_LIST_TABLE.columnIds.objectTypeIndicator,
];

const isRowChecked = (
  cell: ReactTableCell<ObjectSearchTableData, unknown>,
  table: Table<ObjectSearchTableData>,
) => Boolean(table.options.meta?.checkedRows?.includes(cell.row.index));

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

    const showObjectTypeIndicator = table
      .getColumn(OBJECT_LIST_TABLE.columnIds.objectTypeIndicator)
      ?.getIsVisible();

    const original = row.original;
    const cellContext = cell.getContext();

    const { config }: { config: ParsedSkylarkObjectConfig | null } =
      cellContext.table.options.meta?.objectTypesWithConfig?.find(
        ({ objectType }) => objectType === original.objectType,
      ) || { config: null };

    return tableMeta?.activeObject && isHoveredRow ? (
      <span className="block h-full w-5 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat opacity-60" />
    ) : showObjectTypeIndicator ? (
      <div className="flex h-full items-center justify-center">
        <div
          className="h-2 w-2 rounded-full bg-manatee-300"
          style={{ background: config ? config.colour : undefined }}
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
      const original = row.original as ParsedSkylarkObject;
      const cellContext = cell.getContext();

      const { config }: { config: ParsedSkylarkObjectConfig | null } =
        cellContext.table.options.meta?.objectTypesWithConfig?.find(
          ({ objectType }) => objectType === original.objectType,
        ) || { config: null };

      return (
        <div className="flex h-full w-full items-center pr-0.5">
          <Pill
            label={config?.objectTypeDisplayName || original.objectType}
            bgColor={config?.colour}
            className="w-full"
          />
        </div>
      );
    },
  },
);

// TODO remove this when we're settled on a design for the indicator
const objectTypeIndicatorColumn = columnHelper.display({
  id: OBJECT_LIST_TABLE.columnIds.objectTypeIndicator,
  header: "",
  size: 0,
  maxSize: 0,
  minSize: 0,
  cell: ({ cell, row }) => {
    const original = row.original as ParsedSkylarkObject;
    const cellContext = cell.getContext();

    const { config }: { config: ParsedSkylarkObjectConfig | null } =
      cellContext.table.options.meta?.objectTypesWithConfig?.find(
        ({ objectType }) => objectType === original.objectType,
      ) || { config: null };

    return (
      // <div
      //   className="mx-auto h-1.5 w-1.5 rounded-full bg-manatee-300"
      //   style={{ background: config ? config.colour : undefined }}
      // />
      <></>
    );
  },
});

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
  size: 120,
  minSize: 80,
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
        <button
          onClick={(e) => {
            if (tableMeta?.onObjectClick) {
              e.stopPropagation();
              tableMeta.onObjectClick(
                convertParsedObjectToIdentifier(object as ParsedSkylarkObject),
                PanelTab.Availability,
              );
            }
          }}
        >
          <AvailabilityLabel status={status} />
        </button>
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
    const imageRelationships =
      props.getValue<ParsedSkylarkObjectImageRelationship[]>();
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

    const allImages = imageRelationships
      .flatMap(({ objects }) => objects)
      .filter((obj) => obj);

    if (allImages.length === 0) {
      return "";
    }

    return (
      <div className={wrapperClassName}>
        {allImages.map(({ uid, url, title, _meta }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${props.row.id}-${uid}`}
            onClick={(e) => {
              if (props.table.options.meta?.onObjectClick) {
                e.stopPropagation();
                props.table.options.meta.onObjectClick({
                  uid,
                  objectType: BuiltInSkylarkObjectType.SkylarkImage,
                  language: _meta?.language_data.language || "",
                });
              }
            }}
            className={className}
            src={addCloudinaryOnTheFlyImageTransformation(
              url,
              cloudinaryConfig,
            )}
            alt={title}
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
    tableMeta?.checkedRows &&
    tableMeta.checkedRows.length > 0 && (
      <Checkbox
        aria-label="clear-all-checked-objects"
        checked="indeterminate"
        onClick={() => tableMeta.batchCheckRows("clear-all")}
      />
    ),
  cell: ({ cell, table }) => {
    const checked = isRowChecked(cell, table);
    const tableMeta = table.options.meta;
    return (
      <Checkbox
        checked={checked}
        // Not using onCheckChanged so that we have access to the native click event
        onClick={(e) => {
          e.stopPropagation();
          if (e.shiftKey) {
            tableMeta?.batchCheckRows("shift", cell.row.index);
          } else {
            tableMeta?.onRowCheckChange?.({
              checkedState: !checked,
              object: cell.row.original as ParsedSkylarkObject,
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
): ColumnDef<ParsedSkylarkObject, ParsedSkylarkObject>[] => {
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
    objectTypeIndicatorColumn,
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
      ParsedSkylarkObject,
      ParsedSkylarkObject
    >[];
  }

  return orderedColumnArray as ColumnDef<
    ParsedSkylarkObject,
    ParsedSkylarkObject
  >[];
};
