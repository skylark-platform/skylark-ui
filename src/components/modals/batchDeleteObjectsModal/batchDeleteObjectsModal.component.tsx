import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "src/components/button";
import { Modal } from "src/components/modals/base/modal";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { useBulkDeleteObjects } from "src/hooks/objects/delete/useBulkDeleteObjects";
import { ParsedSkylarkObject } from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

const DELETION_LIMIT = 20;

interface BatchDeleteObjectsModalProps {
  objectsToBeDeleted: ParsedSkylarkObject[];
  isOpen: boolean;
  closeModal: () => void;
  removeObject: (uid: string) => void;
  onDeletionComplete: (deletedObjects: ParsedSkylarkObject[]) => void;
}

const generateDescription = (
  objectsToBeDeleted: ParsedSkylarkObject[],
  multipleLanguages: boolean,
) => {
  if (objectsToBeDeleted.length > 1) {
    const objectTypeDesc = multipleLanguages
      ? "objects and translations"
      : "objects";
    return `The following ${objectTypeDesc} will be permanently deleted:`;
  }

  if (objectsToBeDeleted.length === 1) {
    const objectTypeDesc =
      objectsToBeDeleted[0].meta.availableLanguages.length > 1
        ? "translation"
        : "object";
    return `The following ${objectTypeDesc} will be permanently deleted:`;
  }

  return "No objects selected for deletion.";
};

const DeleteButtonWithConfirmation = ({
  confirmationMessage,
  isDeleting,
  onConfirmed,
  onCancel,
}: {
  confirmationMessage: string;
  onConfirmed: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) => {
  const [showDeleteVerification, setShowDeleteVerficiation] = useState(false);
  const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);

  return (
    <div className="mt-6 flex justify-end space-x-2">
      {showDeleteVerification ? (
        <>
          <Button
            variant="primary"
            type="button"
            danger
            loading={isDeleting}
            disabled={deleteButtonDisabled}
            onClick={() => {
              onConfirmed();
            }}
          >
            {confirmationMessage}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowDeleteVerficiation(false)}
          >
            Go back
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="primary"
            type="button"
            danger
            loading={false}
            onClick={() => {
              setDeleteButtonDisabled(true);
              setTimeout(() => setDeleteButtonDisabled(false), 2000);
              setShowDeleteVerficiation(true);
            }}
          >
            {`Delete objects`}
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </>
      )}
    </div>
  );
};

const BatchDeleteObjectsModalContent = ({
  objects: propObjects,
  closeModal,
  onDeletionComplete,
}: {
  objects: ParsedSkylarkObject[];
  closeModal: () => void;
  onDeletionComplete: BatchDeleteObjectsModalProps["onDeletionComplete"];
}) => {
  const { deleteObjects, isDeleting } = useBulkDeleteObjects({
    onSuccess: onDeletionComplete,
    onError: console.log,
  });

  const [objects, setObjects] = useState(propObjects);

  const groupedObjectsByUID = objects.reduce(
    (prev, obj): Record<string, ParsedSkylarkObject[]> => {
      if (hasProperty(prev, obj.uid)) {
        return {
          ...prev,
          [obj.uid]: [...prev[obj.uid], obj],
        };
      }

      return {
        ...(prev as Record<string, ParsedSkylarkObject[]>),
        [obj.uid]: [obj],
      };
    },
    {} as Record<string, ParsedSkylarkObject[]>,
  );

  const orderedObjects = Object.values(groupedObjectsByUID).flatMap(
    (arr) => arr,
  );
  const firstTwentyObjectsToBeDeleted = orderedObjects.slice(0, 20);

  const firstObjectOverTheLimit =
    orderedObjects.length > 20 ? orderedObjects[20] : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollShadow, setShowScrollShadow] = useState(false);
  const calculateShowScrollShadow = useCallback(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      const bottomReached: boolean =
        el.scrollHeight - el.scrollTop - el.clientHeight <= 1;
      setShowScrollShadow(!bottomReached);
    }
  }, []);
  const debouncedOnScroll = useDebouncedCallback(calculateShowScrollShadow, 20);

  return (
    <>
      <div
        className={clsx(
          "mt-4 overflow-auto",
          showScrollShadow && "shadow-scroll-hint",
        )}
        ref={containerRef}
        onScroll={debouncedOnScroll}
      >
        {Object.entries(groupedObjectsByUID).map(([uid, objects]) => {
          return (
            <div
              key={uid}
              className={clsx(
                "mb-4 w-full",
                "after:mt-4 after:block after:h-px after:w-full after:bg-manatee-200 after:content-['']",
                "last:after:hidden",
              )}
            >
              {objects.map((obj) => {
                const index = orderedObjects.findIndex((_obj) => obj === _obj);
                return (
                  <>
                    {obj === firstObjectOverTheLimit && (
                      <div className="mt-8 border-t-2 border-error pb-6 pt-8">
                        <p className="font-medium">
                          These objects will not be deleted:
                        </p>
                      </div>
                    )}
                    <div className={clsx(index >= 20 && "opacity-30")}>
                      <ObjectIdentifierCard
                        key={`${uid}-${obj.meta.language}`}
                        object={obj}
                        onDeleteClick={() =>
                          setObjects((currentObjects) =>
                            currentObjects.filter((_obj) => obj !== _obj),
                          )
                        }
                        deleteIconVariant="x"
                      >
                        <p className="pr-1 text-manatee-500">{`${obj.meta.language}`}</p>
                      </ObjectIdentifierCard>
                    </div>
                  </>
                );
              })}
            </div>
          );
        })}
      </div>
      <DeleteButtonWithConfirmation
        confirmationMessage={`Permanently delete ${firstTwentyObjectsToBeDeleted.length} object(s)`}
        onCancel={closeModal}
        isDeleting={isDeleting}
        onConfirmed={() =>
          deleteObjects({ objects: firstTwentyObjectsToBeDeleted })
        }
      />
    </>
  );
};

export const BatchDeleteObjectsModal = ({
  objectsToBeDeleted,
  isOpen,
  closeModal,
  onDeletionComplete,
}: BatchDeleteObjectsModalProps) => {
  const uids = objectsToBeDeleted.map(({ uid }) => uid);
  const overOneLanguageSelected = uids.some(
    (uid, index) => uids.indexOf(uid) !== index,
  );

  return (
    <Modal
      title="Bulk Delete"
      description={generateDescription(
        objectsToBeDeleted,
        overOneLanguageSelected,
      )}
      isOpen={isOpen}
      closeModal={closeModal}
      data-testid="batch-delete-objects-modal"
      size="medium"
    >
      {objectsToBeDeleted.length > DELETION_LIMIT && (
        <div className="mt-2 border-l-4 border-warning p-2 text-black">
          <p>
            {`Currently limited to deleting ${DELETION_LIMIT} objects and
          translations at a time.`}
          </p>
        </div>
      )}
      <BatchDeleteObjectsModalContent
        key={uids.join("-")}
        objects={objectsToBeDeleted}
        closeModal={closeModal}
        onDeletionComplete={onDeletionComplete}
      />
    </Modal>
  );
};
