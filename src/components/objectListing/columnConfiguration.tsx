import { Checkbox } from "@radix-ui/react-checkbox";
import { createColumnHelper } from "@tanstack/react-table";

import { AvailabilityLabel } from "src/components/availability";
import { Pill } from "src/components/pill";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import {
  ParsedSkylarkObject,
  ParsedSkylarkObjectAvailability,
  ParsedSkylarkObjectImageRelationship,
} from "src/interfaces/skylark";
import {
  addCloudinaryOnTheFlyImageTransformation,
  formatObjectField,
} from "src/lib/utils";

import { TableCell } from "./table";

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
    header: formatObjectField("Translation"),
    size: 120,
    cell: (props) => <TableCell {...props} />,
  },
);

const availabilityColumn = columnHelper.accessor("meta.availabilityStatus", {
  header: formatObjectField("Availability"),
  size: 120,
  cell: (props) => {
    const status = props.getValue<ParsedSkylarkObjectAvailability["status"]>();
    return status && <AvailabilityLabel status={status} />;
  },
});

// Temporarily unused until we add images back into Content Library
const imagesColumn = columnHelper.accessor("images", {
  header: formatObjectField("Images"),
  size: 100,
  cell: (props) => {
    const imageRelationships =
      props.getValue<ParsedSkylarkObjectImageRelationship[]>();
    const allImages = imageRelationships
      .flatMap(({ objects }) => objects)
      .filter((obj) => obj);

    if (
      !imageRelationships ||
      imageRelationships.length === 0 ||
      allImages.length === 0
    ) {
      return "";
    }

    return (
      <div>
        {allImages.map(({ uid, url, title }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={addCloudinaryOnTheFlyImageTransformation(url, { height: 50 })}
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
  header: () => <Checkbox aria-label="toggle-select-all-objects" />,
  cell: () => <Checkbox />,
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
    dragIconColumn,
    objectTypeColumn,
    displayNameColumn,
    translationColumn,
    imagesColumn,
    availabilityColumn,
    ...createdColumns,
  ];
  if (opts.withObjectSelect) {
    return [selectColumn, ...orderedColumnArray];
  }
  return [...orderedColumnArray, actionColumn];
};
