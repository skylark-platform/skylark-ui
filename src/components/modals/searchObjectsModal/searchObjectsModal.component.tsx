import { CheckedState } from "@radix-ui/react-checkbox";
import React, { useMemo } from "react";

import { Button } from "src/components/button";
import { Modal } from "src/components/modals/base/modal";
import {
  ObjectSearch,
  ObjectSearchInitialColumnsState,
} from "src/components/objectSearch";
import { OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS } from "src/components/objectSearch/results/columnConfiguration";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { CheckedObjectState, useCheckedObjectsState } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  SkylarkObject,
  SkylarkObjectTypes,
  SkylarkSystemField,
} from "src/interfaces/skylark";

interface SearchObjectsModalProps {
  title: string;
  objectTypes?: SkylarkObjectTypes;
  columns?: string[];
  isOpen: boolean;
  existingObjects?: SkylarkObject[] | null;
  existingCheckedState?: CheckedState;
  initialSearchQuery?: string;
  showSearchFilters?: boolean;
  showAllColumns?: boolean;
  closeModal: () => void;
  onSave: (args: {
    checkedObjectsState: CheckedObjectState[];
    checkedObjects: SkylarkObject[];
  }) => void;
}

const generateSaveMessage = ({
  checkedUids,
  checkedObjectTypesForDisplay,
  existingObjects = [],
}: {
  checkedUids: string[];
  checkedObjectTypesForDisplay: string[];
  existingObjects?: SkylarkObject[];
}) => {
  const existingUids = existingObjects.map(({ uid }) => uid);

  const addedObjects = checkedUids.filter((uid) => !existingUids.includes(uid));

  // const removedObjects = existingObjects.filter(
  //   ({ uid }) => !checkedUids.includes(uid),
  // );

  const objectTypeStr =
    checkedObjectTypesForDisplay.length === 1
      ? `${checkedObjectTypesForDisplay[0]}`
      : "Objects";

  const addStr = addedObjects.length > 0 ? `${addedObjects.length}` : "";
  // const addStr = addedObjects.length > 0 ? `Add ${addedObjects.length}` : "";
  // const removeStr =
  //   removedObjects.length > 0 ? `Remove ${removedObjects.length}` : "";

  // if (addStr && removeStr) {
  //   return `${addStr} & ${removeStr} ${objectTypeStr}`;
  // }

  if (addStr) {
    return `${addStr} ${objectTypeStr}`;
  }

  // if (removeStr) {
  //   return `${removeStr} ${objectTypeStr}`;
  // }

  return null;
};

export const SearchObjectsModal = ({
  title,
  isOpen,
  objectTypes,
  columns: propColumns,
  existingObjects,
  existingCheckedState,
  initialSearchQuery,
  showSearchFilters = false,
  showAllColumns = false,
  closeModal,
  onSave,
}: SearchObjectsModalProps) => {
  const {
    checkedObjectsState,
    checkedUids,
    checkedObjects,
    checkedObjectTypesForDisplay,
    setCheckedObjectsState,
    resetCheckedObjects,
  } = useCheckedObjectsState(
    existingObjects?.map(
      (object): CheckedObjectState => ({
        checkedState: existingCheckedState || "indeterminate",
        object,
      }),
    ),
  );
  const onModalCloseWrapper = () => {
    onSave({ checkedObjectsState, checkedObjects });
    closeModal();
    setCheckedObjectsState([]);
  };

  const initialColumnState: Partial<ObjectSearchInitialColumnsState> =
    useMemo(() => {
      const columns = propColumns;

      return {
        columns: [
          ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
          OBJECT_LIST_TABLE.columnIds.displayField,
          ...(objectTypes?.includes(BuiltInSkylarkObjectType.SkylarkImage)
            ? [OBJECT_LIST_TABLE.columnIds.images]
            : []),
          ...(columns || [
            SkylarkSystemField.UID,
            SkylarkSystemField.ExternalID,
          ]),
        ],
        frozen: [
          ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
          OBJECT_LIST_TABLE.columnIds.displayField,
        ],
      };
    }, [propColumns]);

  const saveMessage = generateSaveMessage({
    checkedUids,
    checkedObjectTypesForDisplay,
    existingObjects: existingObjects || [],
  });

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      closeModal={closeModal}
      data-testid="search-objects-modal"
      withoutBodyPadding
      size="large"
      growHeight
    >
      <div className="ml-2 flex-grow overflow-auto pr-0 pt-2 md:ml-4 md:pl-4">
        <ObjectSearch
          id={`search-object-modal-${objectTypes?.join("-")}`}
          initialFilters={{ objectTypes, query: initialSearchQuery }}
          initialColumnState={showAllColumns ? undefined : initialColumnState}
          checkedObjectsState={checkedObjectsState}
          onObjectCheckedChanged={setCheckedObjectsState}
          resetCheckedObjects={resetCheckedObjects}
          hideSearchFilters={!showSearchFilters}
          hideBulkOptions
          withObjectSelect
        />
      </div>
      <div className="flex justify-end items-center space-x-2 px-6 md:px-10 mt-4">
        <p className="text-manatee-700 mr-2">{saveMessage}</p>
        <Button
          variant="primary"
          onClick={onModalCloseWrapper}
          type="button"
          disabled={saveMessage === null}
          success
          data-testid="search-objects-modal-save"
        >
          {/* Save */}
          Add
        </Button>
        <Button variant="outline" type="button" danger onClick={closeModal}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
