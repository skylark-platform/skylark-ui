import { EnumComparisonTable } from "./enumComparisonTable.component";

const rows = Array.from({ length: 10 }, (_, i) => ({
  id: `Row ${i + 1}`,
  value: `VALUE_${i + 1}`,
  type: (i % 4 === 0 && "removed") || (i % 3 === 0 && "added") || "equal",
}));

export default { component: EnumComparisonTable };
export const Default = {
  args: {
    rows,
  },
};
