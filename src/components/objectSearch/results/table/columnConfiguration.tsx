import { createColumnHelper } from "@tanstack/react-table";

import { AvailabilityLabel } from "src/components/availability";
import { Checkbox } from "src/components/inputs/checkbox";
import { Pill } from "src/components/pill";
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

const columnHelper = createColumnHelper<object>();

// Issues with Safari means its safe to allow the drag icon have it's own column than use a pseudo field
const dragIconColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.dragIcon,
  {
    header: "",
    size: 20,
    cell: () => (
      <span className="block h-full w-5 bg-inherit bg-[url('/icons/drag_indicator_black.png')] bg-center bg-no-repeat opacity-0 group-hover/row:opacity-60" />
    ),
  },
);

const objectTypeColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.objectType,
  {
    header: "",
    size: 100,
    cell: ({ row }) => {
      const original = row.original as ParsedSkylarkObject;
      return (
        <div className="flex h-full items-center">
          <Pill
            label={original.config.objectTypeDisplayName || original.objectType}
            bgColor={original.config.colour}
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
    header: formatObjectField("Display Field"),
    size: 250,
    cell: (props) => <TableCell {...props} />,
  },
);

const translationColumn = columnHelper.accessor(
  OBJECT_LIST_TABLE.columnIds.translation,
  {
    id: OBJECT_LIST_TABLE.columnIds.translation,
    header: formatObjectField("Translation"),
    size: 120,
    cell: (props) => <TableCell {...props} />,
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
            e.stopPropagation();
            tableMeta?.onObjectClick?.(
              convertParsedObjectToIdentifier(object as ParsedSkylarkObject),
              PanelTab.Availability,
            );
          }}
        >
          <AvailabilityLabel status={status} />
        </button>
      )
    );
  },
});

// Temporarily unused until we add images back into Content Library
const imagesColumn = columnHelper.accessor("images", {
  header: formatObjectField("Images"),
  size: 100,
  cell: (props) => {
    const imageRelationships =
      props.getValue<ParsedSkylarkObjectImageRelationship[]>();
    const imageObj = props.row.original as ParsedSkylarkObject;

    const cloudinaryConfig = { height: 50 };
    const className = "object-cover object-left";

    if (
      imageObj.objectType === BuiltInSkylarkObjectType.SkylarkImage &&
      hasProperty(imageObj, "url")
    ) {
      return (
        <div>
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
      <div>
        {allImages.map(({ uid, url, title, _meta }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
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
            key={`${props.row.id}-${uid}`}
            alt={title}
          />
        ))}
      </div>
    );
  },
});

const selectColumn = columnHelper.display({
  id: OBJECT_LIST_TABLE.columnIds.checkbox,
  size: 26,
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
});

const actionColumn = columnHelper.display({
  id: OBJECT_LIST_TABLE.columnIds.actions,
  size: 100,
  cell: (props) => <TableCell {...props} />,
});

export const createObjectListingColumns = (
  columns: string[],
  hardcodedColumns: string[],
  opts: { withObjectSelect?: boolean },
) => {
  const createdColumns = columns
    .filter((column) => !hardcodedColumns.includes(column))
    .map((column) =>
      columnHelper.accessor(column, {
        id: column,
        header: formatObjectField(column),
        size: 200,
        cell: (props) => <TableCell {...props} />,
      }),
    );

  const orderedColumnArray = [
    objectTypeColumn,
    displayNameColumn,
    translationColumn,
    imagesColumn,
    availabilityColumn,
    ...createdColumns,
  ];
  if (opts.withObjectSelect) {
    return [dragIconColumn, selectColumn, ...orderedColumnArray, actionColumn];
  }
  return [dragIconColumn, ...orderedColumnArray, actionColumn];
};
