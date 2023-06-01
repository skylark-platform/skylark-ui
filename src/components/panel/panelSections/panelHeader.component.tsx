import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { DocumentNode } from "graphql";
import { useMemo, useState } from "react";
import { GrGraphQl } from "react-icons/gr";
import { toast } from "react-toastify";

import { AvailabilityLabelPill } from "src/components/availability";
import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import {
  Edit,
  Trash,
  MoreVertical,
  ArrowLeft,
  ExternalLink,
} from "src/components/icons";
import { LanguageSelect } from "src/components/inputs/select";
import { CreateObjectModal } from "src/components/modals/createObjectModal";
import { DisplayGraphQLQueryModal } from "src/components/modals/graphQLQueryModal";
import { PanelLabel } from "src/components/panel/panelLabel";
import { Pill } from "src/components/pill";
import { Skeleton } from "src/components/skeleton";
import { Toast } from "src/components/toast/toast.component";
import { useDeleteObject } from "src/hooks/useDeleteObject";
import {
  AvailabilityStatus,
  ParsedSkylarkObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import {
  getObjectDisplayName,
  getObjectTypeDisplayNameFromParsedObject,
} from "src/lib/utils";

interface PanelHeaderProps {
  isPage?: boolean;
  objectUid: string;
  objectType: SkylarkObjectType;
  object: ParsedSkylarkObject | null;
  language: string;
  currentTab: string;
  tabsWithEditMode: string[];
  graphQLQuery: DocumentNode | null;
  graphQLVariables?: object;
  inEditMode: boolean;
  isSaving?: boolean;
  isTranslatable?: boolean;
  availabilityStatus?: AvailabilityStatus | null;
  toggleEditMode: () => void;
  closePanel?: () => void;
  save: () => void;
  setLanguage: (l: string) => void;
  navigateToPreviousPanelObject?: () => void;
}

const ADD_LANGUAGE_OPTION = "Create Translation";

export const PanelHeader = ({
  isPage,
  objectUid,
  objectType,
  object,
  language,
  currentTab,
  tabsWithEditMode,
  graphQLQuery,
  graphQLVariables,
  inEditMode,
  isSaving,
  isTranslatable,
  availabilityStatus,
  toggleEditMode,
  closePanel,
  save,
  setLanguage,
  navigateToPreviousPanelObject,
}: PanelHeaderProps) => {
  const title = getObjectDisplayName(object);
  const [showGraphQLModal, setGraphQLModalOpen] = useState(false);
  const [createObjectModalOpen, setCreateObjectModalOpen] = useState(false);

  const existingLanguages = object?.meta.availableLanguages || [language];

  const { mutate: deleteObjectMutation } = useDeleteObject({
    objectType,
    onSuccess: ({ objectType, uid }) => {
      toast.success(
        <Toast
          title={`${
            object
              ? getObjectTypeDisplayNameFromParsedObject(object)
              : objectType
          } deleted`}
          message={`${
            object
              ? getObjectTypeDisplayNameFromParsedObject(object)
              : objectType
          } "${object ? getObjectDisplayName(object) : uid}" has been deleted`}
        />,
      );

      const otherLanguages =
        (object?.meta.availableLanguages &&
          object.meta.availableLanguages.filter((lang) => lang !== language)) ||
        [];

      // Change to other language if exists, otherwise close the panel
      return otherLanguages.length > 0
        ? setLanguage(otherLanguages[0])
        : // TODO should we go back, show a object deleted/doesn't exist message?
          closePanel?.();
    },
  });

  const objectMenuOptions = useMemo(
    () => [
      {
        id: "graphql-query",
        text: `Get ${objectType} Query`,
        Icon: (
          <GrGraphQl
            className="text-lg"
            data-testid="graphql-query-modal-button"
          />
        ),
        onClick: () => setGraphQLModalOpen(true),
      },
      {
        id: "delete-object",
        text: `Delete ${language}`,
        Icon: <Trash className="w-5 fill-error stroke-error" />,
        danger: true,
        disabled: true, // TODO finish object deletion (add confirmation modal)
        onClick: () => deleteObjectMutation({ uid: objectUid, language }),
      },
    ],
    [deleteObjectMutation, objectType, objectUid, language],
  );

  const changeLanguage = (val: string) => {
    if (val === ADD_LANGUAGE_OPTION) {
      console.log("Add language");
      setCreateObjectModalOpen(true);
    } else {
      setLanguage(val);
    }
  };

  return (
    <div
      data-testid="panel-header"
      className={clsx(
        "relative mx-auto flex w-full max-w-7xl flex-col p-4 pb-2 md:p-8",
        isPage
          ? "md:flex-row-reverse md:justify-between md:py-8 md:pt-12"
          : "md:py-6",
      )}
    >
      <div className="flex flex-row pb-2">
        <div className="flex flex-grow items-center space-x-2">
          {!isPage && (
            <Button
              Icon={<ArrowLeft />}
              variant="ghost"
              disabled={!navigateToPreviousPanelObject || inEditMode}
              onClick={navigateToPreviousPanelObject}
              aria-label="Open Previous Object"
            />
          )}
          {!isPage && (
            <Button
              Icon={<ExternalLink />}
              variant="ghost"
              href={
                language
                  ? `/object/${objectType}/${objectUid}?language=${language}`
                  : `/object/${objectType}/${objectUid}`
              }
              newTab
            />
          )}
          <DropdownMenu options={objectMenuOptions} align="left">
            <DropdownMenuButton
              className="flex focus:outline-none focus-visible:ring-2 group-hover:text-black"
              aria-label="Open Panel Menu"
            >
              <MoreVertical className="h-6 w-6" />
            </DropdownMenuButton>
          </DropdownMenu>

          {inEditMode ? (
            <>
              <Button
                variant="primary"
                success
                onClick={save}
                disabled={isSaving}
              >
                Save
              </Button>
              <Button
                variant="outline"
                danger
                onClick={toggleEditMode}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                Icon={<Edit className="h-4 w-4 stroke-success-content" />}
                onClick={toggleEditMode}
                disabled={!tabsWithEditMode.includes(currentTab)}
              >
                Edit {currentTab}
              </Button>
            </>
          )}
        </div>

        {!isPage && closePanel && (
          <Button variant="ghost" onClick={closePanel}>
            Close
          </Button>
        )}
      </div>
      <div className="flex flex-col items-start pb-2">
        {title ? (
          <h1 className="h-6 w-full flex-grow truncate text-ellipsis text-lg font-bold uppercase md:text-xl">
            {title}
          </h1>
        ) : (
          <Skeleton className="h-6 w-80" />
        )}

        <div className="mt-2 flex h-5 items-center justify-center gap-2">
          {object ? (
            <>
              <Pill
                bgColor={object.config.colour}
                className="w-20 bg-brand-primary"
                label={object.config.objectTypeDisplayName || objectType}
              />
              {availabilityStatus && (
                <AvailabilityLabelPill status={availabilityStatus} />
              )}
              {isTranslatable && (
                <LanguageSelect
                  selected={language || object.meta.language}
                  disabled={inEditMode || !object.meta.availableLanguages}
                  variant="pill"
                  languages={[...existingLanguages, ADD_LANGUAGE_OPTION]}
                  optionsClassName="w-36"
                  onChange={changeLanguage}
                />
              )}
            </>
          ) : (
            <>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </>
          )}
        </div>
        <div className="flex flex-row items-end justify-end space-x-2">
          {inEditMode && (
            <div
              className={clsx(
                "absolute left-1/2 -bottom-16 z-10 -translate-x-1/2",
                isPage ? "md:fixed md:top-24 md:bottom-auto" : " md:-bottom-18",
              )}
            >
              <PanelLabel
                text={isSaving ? "Saving" : "Editing"}
                loading={isSaving}
              />
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showGraphQLModal && (
          <DisplayGraphQLQueryModal
            label={`Get ${objectType} object`}
            query={graphQLQuery}
            variables={graphQLVariables}
            close={() => setGraphQLModalOpen(false)}
          />
        )}
        <CreateObjectModal
          createTranslation={{
            uid: objectUid,
            language,
            objectType,
            objectTypeDisplayName: object?.config.objectTypeDisplayName,
            existingLanguages,
            objectDisplayName: title,
          }}
          isOpen={createObjectModalOpen}
          objectType={objectType}
          setIsOpen={setCreateObjectModalOpen}
          onObjectCreated={(obj) => {
            setLanguage(obj.language);
          }}
        />
      </AnimatePresence>
    </div>
  );
};
