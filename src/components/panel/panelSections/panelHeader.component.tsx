import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { DocumentNode } from "graphql";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiEdit,
  FiExternalLink,
  FiMoreVertical,
  FiRefreshCw,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { GrGraphQl } from "react-icons/gr";

import { AvailabilityLabelPill } from "src/components/availability";
import { Button, ButtonProps } from "src/components/button";
import { ButtonWithDropdown } from "src/components/buttonWithDropdown";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { FiX } from "src/components/icons";
import { LanguageSelect } from "src/components/inputs/select";
import {
  CreateObjectModal,
  DeleteObjectModal,
  DisplayGraphQLQueryModal,
} from "src/components/modals";
import { PanelLabel } from "src/components/panel/panelLabel";
import { ObjectTypePill } from "src/components/pill";
import { Skeleton } from "src/components/skeleton";
import { QueryKeys } from "src/enums/graphql";
import { PanelTab } from "src/hooks/state";
import {
  AvailabilityStatus,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { getObjectDisplayName, userIsOnMac } from "src/lib/utils";

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
  objectMetadataHasChanged: boolean;
  toggleEditMode: () => void;
  closePanel?: () => void;
  save: (opts?: { draft?: boolean }) => void;
  setLanguage: (l: string) => void;
  navigateToPreviousPanelObject?: () => void;
  navigateToForwardPanelObject?: () => void;
}

const ADD_LANGUAGE_OPTION = "Create Translation";

const getAlternateSaveButtonText = (
  isDraft: boolean,
  objectMetadataHasChanged: boolean,
) => {
  if (!isDraft) {
    return "Save as Draft";
  }

  if (objectMetadataHasChanged) {
    return "Save & Publish";
  }

  return "Publish";
};

const getObjectQueryKeys = Object.values(QueryKeys).filter((key) =>
  key.startsWith(QueryKeys.GetObject),
);

const RefreshPanelQueries = (props: Omit<ButtonProps, "variant">) => {
  const client = useQueryClient();

  const [isFetching, setIsFetching] = useState(false);

  const onClick = async () => {
    setIsFetching(true);

    await Promise.all(
      getObjectQueryKeys.map((key) =>
        client.refetchQueries({
          queryKey: [key],
        }),
      ),
    );

    setIsFetching(false);
  };

  return (
    <Button
      {...props}
      Icon={
        <FiRefreshCw
          className={clsx("text-xl", isFetching && "animate-spin")}
        />
      }
      variant="ghost"
      onClick={onClick}
      aria-label="Refresh Panel"
    />
  );
};

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
  objectMetadataHasChanged,
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

  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const objectTypeDisplayName =
    object?.config.objectTypeDisplayName || objectType;

  const actualLanguage = object?.meta.language || language;
  const existingLanguages = object?.meta.availableLanguages || [language];

  const objectMenuOptions = useMemo(
    () => [
      {
        id: "open-in-new-tab",
        text: "Open in new tab",
        Icon: <FiExternalLink className="text-lg" />,
        href: actualLanguage
          ? `/object/${objectType}/${objectUid}?language=${actualLanguage}`
          : `/object/${objectType}/${objectUid}`,
        newTab: true,
      },
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
        Icon: <FiTrash2 className="stroke-error text-xl" />,
        danger: true,
        onClick: () => setDeleteObjectConfirmationModalOpen(true),
      },
    ],
    [
      actualLanguage,
      objectType,
      objectUid,
      objectTypeDisplayName,
      existingLanguages.length,
    ],
  );

  const changeLanguage = (val: string) => {
    if (val === ADD_LANGUAGE_OPTION) {
      setCreateObjectModalOpen(true);
    } else {
      setLanguage(val);
    }
  };

  useEffect(() => {
    const handleSaveKeyPress = (e: KeyboardEvent) => {
      const isMac = userIsOnMac();

      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!saveButtonRef?.current?.disabled) {
          saveButtonRef?.current?.click();
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (!cancelButtonRef?.current?.disabled) {
          cancelButtonRef?.current?.click();
        }
      }
    };

    if (inEditMode) {
      document.addEventListener("keydown", handleSaveKeyPress);
      return () => document.removeEventListener("keydown", handleSaveKeyPress);
    }
  }, [inEditMode]);

  const isDraft = object?.meta.published === false;

  return (
    <div
      data-testid="panel-header"
      className={clsx(
        "relative mx-auto flex w-full max-w-7xl flex-col px-4 py-2 md:px-8",
        isPage
          ? "md:flex-row-reverse md:justify-between md:py-8 md:pt-12"
          : "md:py-4",
      )}
    >
      <div className="flex flex-row items-center pb-2 md:pb-4">
        <div className="flex flex-grow items-center space-x-2">
          {!isPage && (
            <>
              <Button
                Icon={<FiArrowLeft className="text-2xl" />}
                variant="ghost"
                disabled={!navigateToPreviousPanelObject || inEditMode}
                onClick={navigateToPreviousPanelObject}
                aria-label="Click to go back"
              />
              <Button
                Icon={<FiArrowRight className="text-2xl" />}
                variant="ghost"
                disabled={!navigateToForwardPanelObject || inEditMode}
                onClick={navigateToForwardPanelObject}
                aria-label="Click to go forward"
              />
              <RefreshPanelQueries disabled={inEditMode} />
            </>
          )}
          <DropdownMenu options={objectMenuOptions} placement="bottom-end">
            <DropdownMenuButton
              className="flex focus:outline-none focus-visible:ring-2 group-hover:text-black"
              aria-label="Open Panel Menu"
            >
              <FiMoreVertical className="text-2xl" />
            </DropdownMenuButton>
          </DropdownMenu>

          {inEditMode ? (
            <>
              {currentTab === PanelTab.Metadata &&
              objectType !== BuiltInSkylarkObjectType.Availability ? (
                <ButtonWithDropdown
                  ref={saveButtonRef}
                  success
                  onClick={() => save({ draft: isDraft })}
                  disabled={isSaving}
                  variant="primary"
                  options={[
                    {
                      id: "save-alternative",
                      text: getAlternateSaveButtonText(
                        isDraft,
                        objectMetadataHasChanged,
                      ),
                      Icon: <FiSave className="text-xl" />,
                      onClick: () => save({ draft: !isDraft }),
                    },
                  ]}
                  aria-label="save changes"
                >
                  {isDraft ? "Save Draft" : "Save"}
                </ButtonWithDropdown>
              ) : (
                <Button
                  ref={saveButtonRef}
                  variant="primary"
                  success
                  onClick={save}
                  disabled={isSaving}
                >
                  Save
                </Button>
              )}
              <Button
                ref={cancelButtonRef}
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
              {tabsWithEditMode.includes(currentTab) && (
                <Button
                  variant="primary"
                  Icon={<FiEdit className="h-4 w-4 stroke-success-content" />}
                  onClick={toggleEditMode}
                  disabled={!tabsWithEditMode.includes(currentTab)}
                  animated={false}
                >
                  Edit {currentTab}
                </Button>
              )}
            </>
          )}
        </div>

        {!isPage && closePanel && (
          <Button
            variant="ghost"
            onClick={closePanel}
            Icon={<FiX className="text-lg" />}
            aria-label="Close Panel"
          />
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
        <div className="flex flex-row items-end justify-end">
          {(inEditMode || currentTab === PanelTab.Metadata) && (
            <div
              className={clsx(
                "absolute -bottom-16 left-1/2 z-10 -translate-x-1/2",
                isPage ? "md:fixed md:bottom-auto md:top-24" : " md:-bottom-18",
              )}
            >
              {inEditMode && (
                <PanelLabel
                  text={isSaving ? "Saving" : "Editing"}
                  warning={isDraft}
                  loading={isSaving}
                />
              )}
              {!inEditMode && isDraft && <PanelLabel text="Draft" warning />}
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
