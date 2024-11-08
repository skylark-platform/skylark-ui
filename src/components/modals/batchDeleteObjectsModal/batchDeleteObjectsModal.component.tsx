import clsx from "clsx";
import { Fragment, useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "src/components/button";
import { TextInput } from "src/components/inputs/input";
import { Modal } from "src/components/modals/base/modal";
import { ObjectIdentifierCard } from "src/components/objectIdentifier";
import { Toast } from "src/components/toast/toast.component";
import { SEGMENT_KEYS } from "src/constants/segment";
import { useBulkDeleteObjects } from "src/hooks/objects/delete/useBulkDeleteObjects";
import { ParsedSkylarkObject, SkylarkObject } from "src/interfaces/skylark";
import { segment } from "src/lib/analytics/segment";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { hasProperty } from "src/lib/utils";

const DELETION_LIMIT = 100;
const VERIFICATION_TEXT = "permanently delete";

interface BatchDeleteObjectsModalProps {
  objectsToBeDeleted: SkylarkObject[];
  isOpen: boolean;
  closeModal: () => void;
  onDeletionComplete: (deletedObjects: SkylarkObject[]) => void;
}

const generateDescription = (
  objectsToBeDeleted: SkylarkObject[],
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
      objectsToBeDeleted[0].availableLanguages.length > 1
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
  const [input, setInput] = useState("");

  return (
    <div className="mt-6">
      {showDeleteVerification && (
        <div>
          <p className="mb-2">
            {`To confirm deletion, enter "${VERIFICATION_TEXT}" in the text input
            field.`}
          </p>
          <TextInput
            value={input}
            onChange={setInput}
            placeholder={VERIFICATION_TEXT}
          />
        </div>
      )}
      <div className="mt-4 flex justify-end space-x-2">
        {showDeleteVerification ? (
          <>
            <Button
              variant="primary"
              type="button"
              danger
              loading={isDeleting}
              disabled={input !== VERIFICATION_TEXT}
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
                setInput("");
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
    </div>
  );
};

const BatchDeleteObjectsModalContent = ({
  objects: propObjects,
  closeModal,
  onDeletionComplete,
}: {
  objects: SkylarkObject[];
  closeModal: () => void;
  onDeletionComplete: BatchDeleteObjectsModalProps["onDeletionComplete"];
}) => {
  const { deleteObjects, isDeleting } = useBulkDeleteObjects({
    onSuccess: (deletedObjects) => {
      toast.success(
        <Toast
          title={`Batch deletion triggered`}
          message={[
            "The selected objects have been marked for deletion.",
            "It may take a moment before they become unavailable and disappear from Search results.",
          ]}
        />,
      );
      onDeletionComplete(deletedObjects);
      segment.track(SEGMENT_KEYS.bulkOperations.delete, {
        objects: deletedObjects,
      });
    },
    onError: () => {
      toast.error(
        <Toast
          title={`Batch deletion failed to trigger`}
          message={[
            "Unable to trigger a deletion for the selected objects.",
            "Please try again later.",
          ]}
        />,
      );
    },
  });

  const [objects, setObjects] = useState(propObjects);

  const groupedObjectsByUID = objects.reduce(
    (prev, obj): Record<string, SkylarkObject[]> => {
      if (hasProperty(prev, obj.uid)) {
        return {
          ...prev,
          [obj.uid]: [...prev[obj.uid], obj],
        };
      }

      return {
        ...(prev as Record<string, SkylarkObject[]>),
        [obj.uid]: [obj],
      };
    },
    {} as Record<string, SkylarkObject[]>,
  );

  const orderedObjects = Object.values(groupedObjectsByUID).flatMap(
    (arr) => arr,
  );
  const objectsWithinDeletionLimit = orderedObjects.slice(0, DELETION_LIMIT);

  const firstObjectOverTheLimit =
    orderedObjects.length > DELETION_LIMIT
      ? orderedObjects[DELETION_LIMIT]
      : null;

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
        {objects.length === 0 && propObjects.length !== 0 && (
          <p>No objects selected for deletion.</p>
        )}

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
                  <Fragment key={obj.language}>
                    {obj === firstObjectOverTheLimit && (
                      <div className="mt-8 border-t-2 border-error pb-6 pt-8">
                        <p className="font-medium">
                          These objects will not be deleted:
                        </p>
                      </div>
                    )}
                    <div
                      className={clsx(index >= DELETION_LIMIT && "opacity-30")}
                    >
                      <ObjectIdentifierCard
                        key={`${uid}-${obj.language}`}
                        object={obj}
                        onDeleteClick={() =>
                          setObjects((currentObjects) =>
                            currentObjects.filter((_obj) => obj !== _obj),
                          )
                        }
                        deleteIconVariant="x"
                      >
                        <p className="pr-1 text-manatee-500">{`${obj.language}`}</p>
                      </ObjectIdentifierCard>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          );
        })}
      </div>
      {objects.length > 0 ? (
        <DeleteButtonWithConfirmation
          confirmationMessage={`Permanently delete ${objectsWithinDeletionLimit.length} object(s)`}
          onCancel={closeModal}
          isDeleting={isDeleting}
          onConfirmed={() =>
            deleteObjects({ objects: objectsWithinDeletionLimit })
          }
        />
      ) : (
        <div className="flex justify-end">
          <Button variant="primary" type="button" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      )}
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
