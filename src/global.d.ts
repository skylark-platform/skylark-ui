// @tanstack/react-table meta object declaration
// https://github.com/TanStack/table/blob/10a2448b7ce23fc6a93fdfd0b39dc55d1374c0bf/docs/api/core/column-def.md?plain=1#L95
export declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    rowInEditMode: string;
    onEditClick: (rowId: string) => void;
    onEditCancelClick: () => void;
    onEditSaveClick: () => void;
    editingObjectData: object;
    updateEditingObjectData: (
      objectField: string,
      newValue: string | number | boolean | null,
    ) => void;
  }
}
