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
import { formatObjectField } from "src/lib/utils";

import { TableCell } from "./table";

const columnHelper = createColumnHelper<object>();

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
            className="w-full bg-brand-primary"
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

const availabilityColumn = columnHelper.accessor("availability", {
  header: formatObjectField("Availability"),
  size: 120,
  cell: (props) => {
    const { status } = props.getValue<ParsedSkylarkObjectAvailability>();
    return status && <AvailabilityLabel status={status} />;
  },
});

// Temporarily unused until we add images back into Content Library
const imagesColumn = columnHelper.accessor("images", {
  header: formatObjectField("Images"),
  cell: (props) => {
    const imageRelationships =
      props.getValue<ParsedSkylarkObjectImageRelationship[]>();
    const allImages = imageRelationships.flatMap(({ objects }) => objects);
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
          <img src={url} key={`${props.row.id}-${uid}`} alt={title} />
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
    // imagesColumn,
    availabilityColumn,
    ...createdColumns,
  ];
  if (opts.withObjectSelect) {
    return [selectColumn, ...orderedColumnArray];
  }
  return [...orderedColumnArray, actionColumn];
};
