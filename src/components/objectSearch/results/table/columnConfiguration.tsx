import {
  Cell,
  Table,
  TableMeta,
  createColumnHelper,
} from "@tanstack/react-table";

import { AvailabilityLabel } from "src/components/availability";
import { Checkbox } from "src/components/inputs/checkbox";
import { RowActions } from "src/components/objectSearch/rowActions";
import { ObjectTypePill, Pill } from "src/components/pill";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { PanelTab } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  ParsedSkylarkObjectAvailability,
  ParsedSkylarkObjectImageRelationship,
} from "src/interfaces/skylark";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import {
  addCloudinaryOnTheFlyImageTransformation,
  formatObjectField,
  getObjectDisplayName,
  hasProperty,
} from "src/lib/utils";

import { TableCell } from ".";

export const OBJECT_SEARCH_HARDCODED_COLUMNS = [
  OBJECT_LIST_TABLE.columnIds.objectType,
  OBJECT_LIST_TABLE.columnIds.translation,
  OBJECT_LIST_TABLE.columnIds.availability,
  OBJECT_LIST_TABLE.columnIds.images,
];
export const OBJECT_SEARCH_ORDERED_KEYS = [
  "uid",
  "external_id",
  "data_source_id",
  "type",
];

const isRowChecked = (cell: Cell<object, unknown>, table: Table<object>) =>
  Boolean(table.options.meta?.checkedRows?.includes(cell.row.index));

const columnHelper = createColumnHelper<object>();

// Issues with Safari means its safe to allow the drag icon have it's own column than use a pseudo field
const dragIconColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.dragIcon,
  {
    id: OBJECT_LIST_TABLE.columnIds.dragIcon,
    header: "",
    size: 20,
    cell: ({ cell, row, table }) => {
      const isCheckedRow = isRowChecked(cell, table);

      const tableMeta = table.options.meta;
      const isHoveredRow = tableMeta?.hoveredRow === row.index;

      return tableMeta?.activeObject && (isCheckedRow || isHoveredRow) ? (
        <span className="block h-full w-5 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat opacity-60" />
      ) : (
        <></>
      );
    },
  },
);

const objectTypeColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.objectType,
  {
    id: OBJECT_LIST_TABLE.columnIds.objectType,
    header: formatObjectField("Object type"),
    size: 120,
    cell: ({ row }) => {
      const original = row.original as ParsedSkylarkObject;
      return (
        <div className="flex h-full w-full items-center pr-2">
          <ObjectTypePill type={original.objectType} className="w-full" />
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
    size: 250,
    cell: (props) => <>{props.cell.getValue() as string}</>,
  },
);

const translationColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.translation,
  {
    id: OBJECT_LIST_TABLE.columnIds.translation,
    header: formatObjectField("Translation"),
    size: 120,
    cell: (props) => <>{props.cell.getValue() as string}</>,
  },
);

const availabilityColumn = columnHelper.accessor("meta.availabilityStatus", {
  id: OBJECT_LIST_TABLE.columnIds.availability,
  header: formatObjectField("Availability"),
  size: 120,
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

const imagesColumn = columnHelper.accessor(OBJECT_LIST_TABLE.columnIds.images, {
  id: OBJECT_LIST_TABLE.columnIds.images,
  header: formatObjectField("Images"),
  size: 100,
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
  size: 24,
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

const actionColumn = columnHelper.display({
  id: OBJECT_LIST_TABLE.columnIds.actions,
  size: 10,
  cell: ({
    cell,
    table: {
      options: { meta: tableMeta },
    },
    row: { original },
  }) => (
    <RowActions
      object={original as ParsedSkylarkObject}
      onInfoClick={() =>
        tableMeta?.onObjectClick?.(
          convertParsedObjectToIdentifier(original as ParsedSkylarkObject),
        )
      }
    />
  ),
});

export const createObjectListingColumns = (
  columns: string[],
  hardcodedColumns: string[],
  opts: { withObjectSelect?: boolean; withPanel: boolean },
) => {
  const createdColumns = columns
    .filter((column) => !hardcodedColumns.includes(column))
    .map((column) =>
      columnHelper.accessor(column, {
        id: column,
        header: formatObjectField(column),
        size: 200,
        cell: (props) => <>{props.cell.getValue() as string}</>,
      }),
    );

  const orderedColumnArray = [
    // actionColumn,
    displayNameColumn,
    objectTypeColumn,
    translationColumn,
    imagesColumn,
    availabilityColumn,
    ...createdColumns,
  ];

  if (opts.withObjectSelect) {
    if (opts.withPanel) {
      return [dragIconColumn, selectColumn, ...orderedColumnArray];
    }
    return [selectColumn, ...orderedColumnArray];
  }

  return orderedColumnArray;
};
