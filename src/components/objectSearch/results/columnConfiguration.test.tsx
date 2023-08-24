import { ColumnDef } from "@tanstack/react-table";

import { ParsedSkylarkObject } from "src/interfaces/skylark";

import { createObjectListingColumns } from "./columnConfiguration";

const baseColumnIds = [
  "__typename-indicator",
  "__typename",
  "skylark-ui-display-field",
  "translation",
  "images",
  "availability",
  "meta-date-created",
  "meta-date-modified",
  "meta-language-version",
  "meta-global-version",
];

const objectSelectColumnIds = [
  "drag-icon",
  "skylark-ui-select",
  ...baseColumnIds,
];

const getColumnIds = (
  columns: ColumnDef<ParsedSkylarkObject, ParsedSkylarkObject>[],
) => {
  return columns.map(({ id }) => id);
};

test("returns base columns when empty arrays are given", () => {
  const got = createObjectListingColumns([], { withPanel: false });

  expect(got).toHaveLength(baseColumnIds.length);
  expect(getColumnIds(got)).toEqual(baseColumnIds);
});

test("adds drag-icon and select checkboxes when withObjectSelect is true", () => {
  const got = createObjectListingColumns([], {
    withPanel: false,
    withObjectSelect: true,
  });

  expect(got).toHaveLength(objectSelectColumnIds.length);
  expect(getColumnIds(got)).toEqual(objectSelectColumnIds);
});

test("adds additional columns", () => {
  const got = createObjectListingColumns(["uid", "external_id"], {
    withPanel: false,
    withObjectSelect: true,
  });

  expect(got).toHaveLength(14);
  expect(getColumnIds(got)).toEqual([
    "drag-icon",
    "skylark-ui-select",
    "__typename-indicator",
    "__typename",
    "skylark-ui-display-field",
    "translation",
    "images",
    "availability",
    "uid",
    "external_id",
    "meta-date-created",
    "meta-date-modified",
    "meta-language-version",
    "meta-global-version",
  ]);
});
