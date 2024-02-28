import { ObjectComparisonTable } from "./objectComparisonTable.component";

const rows = Array.from({ length: 20 }, (_, i) => ({
  id: `Row ${i + 1}`,
  from:
    i === 2
      ? null
      : {
          name: i === 6 ? `Old name` : `Row ${i + 1}`,
          position: i + 1,
          required: i % 4 === 0,
        },
  to:
    i % 6 === 1
      ? null
      : {
          name: `Row ${i + 1}`,
          position: i === 14 ? 100 : i + 1,
          required: i % 3 === 0,
        },
}));

export default { component: ObjectComparisonTable };
export const Default = {
  args: {
    columns: [
      { name: "Name (string)", property: "name" },
      { name: "Position (int)", property: "position" },
      { name: "Required (boolean)", property: "required" },
    ],
    rows,
  },
};

export const DisplayFalsyBoolean = {
  ...Default,
  args: {
    ...Default.args,
    displayFalsyBooleanValues: true,
  },
};
