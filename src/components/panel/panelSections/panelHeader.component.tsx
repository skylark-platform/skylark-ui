import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { DocumentNode } from "graphql";
import { useMemo, useState } from "react";
import { GrGraphQl } from "react-icons/gr";

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
  ArrowRight,
} from "src/components/icons";
import { LanguageSelect } from "src/components/inputs/select";
import {
  CreateObjectModal,
  DeleteObjectModal,
  DisplayGraphQLQueryModal,
} from "src/components/modals";
import { PanelLabel } from "src/components/panel/panelLabel";
import { ObjectTypePill, Pill } from "src/components/pill";
import { Skeleton } from "src/components/skeleton";
import {
  AvailabilityStatus,
  ParsedSkylarkObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { getObjectDisplayName } from "src/lib/utils";

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
  navigateToForwardPanelObject?: () => void;
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
  navigateToForwardPanelObject,
}: PanelHeaderProps) => {
  const title = getObjectDisplayName(object);
  const [showGraphQLModal, setGraphQLModalOpen] = useState(false);
  const [createObjectModalOpen, setCreateObjectModalOpen] = useState(false);
  const [
    deleteObjectConfirmationModalOpen,
    setDeleteObjectConfirmationModalOpen,
  ] = useState(false);

  const objectTypeDisplayName =
    object?.config.objectTypeDisplayName || objectType;

  const actualLanguage = object?.meta.language || language;
  const existingLanguages = object?.meta.availableLanguages || [language];

  const objectMenuOptions = useMemo(
    () => [
      {
        id: "graphql-query",
        text: `Get ${objectTypeDisplayName} Query`,
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
        text:
          existingLanguages.length < 2
            ? `Delete ${objectTypeDisplayName}`
            : `Delete "${actualLanguage}" translation`,
        Icon: <Trash className="w-5 fill-error stroke-error" />,
        danger: true,
        onClick: () => setDeleteObjectConfirmationModalOpen(true),
      },
    ],
    [existingLanguages.length, objectTypeDisplayName, actualLanguage],
  );

  const changeLanguage = (val: string) => {
    if (val === ADD_LANGUAGE_OPTION) {
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
            <>
              <Button
                Icon={<ArrowLeft />}
                variant="ghost"
                disabled={!navigateToPreviousPanelObject || inEditMode}
                onClick={navigateToPreviousPanelObject}
                aria-label="Click to go back"
              />
              <Button
                Icon={<ArrowRight />}
                variant="ghost"
                disabled={!navigateToForwardPanelObject || inEditMode}
                onClick={navigateToForwardPanelObject}
                aria-label="Click to go forward"
              />
              <Button
                Icon={<ExternalLink />}
                variant="ghost"
                href={
                  actualLanguage
                    ? `/object/${objectType}/${objectUid}?language=${actualLanguage}`
                    : `/object/${objectType}/${objectUid}`
                }
                newTab
              />
            </>
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
              <ObjectTypePill
                className="w-20 bg-brand-primary"
                type={objectType}
              />
              {availabilityStatus && (
                <AvailabilityLabelPill status={availabilityStatus} />
              )}
              {isTranslatable && (
                <LanguageSelect
                  selected={actualLanguage}
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
                "absolute -bottom-16 left-1/2 z-10 -translate-x-1/2",
                isPage ? "md:fixed md:bottom-auto md:top-24" : " md:-bottom-18",
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
            key="graphql-query-modal"
            label={`Get ${objectType} object`}
            query={graphQLQuery}
            variables={graphQLVariables}
            close={() => setGraphQLModalOpen(false)}
          />
        )}
      </AnimatePresence>
      <CreateObjectModal
        createTranslation={{
          uid: objectUid,
          language,
          objectType,
          objectTypeDisplayName,
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
      <DeleteObjectModal
        isOpen={deleteObjectConfirmationModalOpen}
        setIsOpen={setDeleteObjectConfirmationModalOpen}
        uid={objectUid}
        objectType={objectType}
        language={actualLanguage}
        objectDisplayName={title}
        objectTypeDisplayName={objectTypeDisplayName}
        availableLanguages={existingLanguages}
        onDeleteSuccess={() => {
          const otherLanguages =
            (object?.meta.availableLanguages &&
              object.meta.availableLanguages.filter(
                (lang) => lang !== actualLanguage,
              )) ||
            [];

          // Change to other language if exists, otherwise close the panel
          return otherLanguages.length > 0
            ? setLanguage(otherLanguages[0])
            : // TODO should we go back, show a object deleted/doesn't exist message?
              closePanel?.();
        }}
      />
    </div>
  );
};
