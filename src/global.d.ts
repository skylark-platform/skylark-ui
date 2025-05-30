// @tanstack/react-table meta object declaration
import { CheckedState } from "@radix-ui/react-checkbox";

import { CheckedObjectState } from "./hooks/state";
import { SetPanelObject } from "./hooks/state/usePanelObjectState";
import { SkylarkObject, SkylarkObjectMeta } from "./interfaces/skylark";

// https://github.com/TanStack/table/blob/10a2448b7ce23fc6a93fdfd0b39dc55d1374c0bf/docs/api/core/column-def.md?plain=1#L95
export declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    checkedObjectsState?: CheckedObjectState[];
    onRowCheckChange?: ({
      rowData,
      checkedState,
    }: {
      rowData: ObjectSearchTableData;
      checkedState: CheckedState;
    }) => void;
    batchCheckRows: (type: "shift" | "clear-all", rowIndex?: number) => void;
    onObjectClick?: SetPanelObject;
    activeObject: SkylarkObject | null;
    objectTypesWithConfig:
      | {
          objectType: string;
          config: ParsedSkylarkObjectConfig;
        }[]
      | undefined;
    objectsMeta: SkylarkObjectMeta[] | null;
    hoveredRow: number | null;
    disableTableEvents: { overflow: boolean; hover: boolean } | null;
  }
}
