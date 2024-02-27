import { SimpleTable } from "./simpleTable.component";

const rows = Array.from({ length: 10 }, (_, i) => ({
  name: `Row ${i + 1}`,
  position: i + 1,
  required: i % 2 === 1,
}));

export default { component: SimpleTable };
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
