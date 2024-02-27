import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";

import { ObjectComparisonTable } from "./objectComparisonTable.component";

test("renders the table", () => {
  const rows = Array.from({ length: 4 }, (_, i) => ({
    id: `Row ${i + 1}`,
    from: {
      name: `Row ${i + 1}`,
      position: i + 1,
      required: i % 3 === 0,
    },
    to: {
      name: `Row ${i + 1}`,
      position: i + 1,
      required: i % 3 === 0,
    },
  }));

  render(
    <ObjectComparisonTable
      rows={rows}
      columns={[
        { name: "Name (string)", property: "name" },
        { name: "Position (int)", property: "position" },
        { name: "Required (boolean)", property: "required" },
      ]}
    />,
  );

  // Columns
  expect(screen.getByText("Name (string)")).toBeInTheDocument();
  expect(screen.getByText("Position (int)")).toBeInTheDocument();
  expect(screen.getByText("Required (boolean)")).toBeInTheDocument();

  // Values
  expect(screen.getByText("Row 4")).toBeInTheDocument();
});

test("displays both old and new values when the value has been modified", async () => {
  const rows = Array.from({ length: 4 }, (_, i) => ({
    id: `Row ${i + 1}`,
    from: {
      name: i === 2 ? "Old Name" : `Row ${i + 1}`,
      position: i + 1,
      required: i % 3 === 0,
    },
    to: {
      name: i === 2 ? "New Name" : `Row ${i + 1}`,
      position: i + 1,
      required: i % 3 === 0,
    },
  }));

  render(
    <ObjectComparisonTable
      rows={rows}
      columns={[
        { name: "Name (string)", property: "name" },
        { name: "Position (int)", property: "position" },
        { name: "Required (boolean)", property: "required" },
      ]}
    />,
  );

  expect(screen.getByText(/Old Name/)).toBeInTheDocument();
  expect(screen.getByText(/New Name/)).toBeInTheDocument();
});
