import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { DocumentNode } from "graphql";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { GrGraphQl } from "react-icons/gr";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { DisplayGraphQLQueryModal } from "src/components/displayGraphQLQuery";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import {
  Edit,
  Expand,
  Trash,
  MoreVertical,
  ArrowLeft,
  ExternalLink,
} from "src/components/icons";
import { LanguageSelect } from "src/components/inputs/select";
import { PanelLabel } from "src/components/panel/panelLabel";
import { Pill } from "src/components/pill";
import { Toast } from "src/components/toast/toast.component";
import { useDeleteObject } from "src/hooks/useDeleteObject";
import { ParsedSkylarkObject, SkylarkObjectType } from "src/interfaces/skylark";
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
  toggleEditMode: () => void;
  closePanel?: () => void;
  save: () => void;
  setLanguage: (l: string) => void;
  navigateToPreviousPanelObject?: () => void;
}

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
  toggleEditMode,
  closePanel,
  save,
  setLanguage,
  navigateToPreviousPanelObject,
}: PanelHeaderProps) => {
  const title = getObjectDisplayName(object);
  const [showGraphQLModal, setGraphQLModalOpen] = useState(false);

  const { mutate: deleteObjectMutation } = useDeleteObject({
    objectType,
    onSuccess: ({ objectType, uid }) => {
      // TODO finesse this so the toast slides in and looks better
      // toast(
      //   <Toast
      //     title={`${objectType} deleted`}
      //     message={`${objectType} ${uid} has been deleted`}
      //     type="success"
      //   />,
      // );
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
        text: `Delete ${objectType}`,
        Icon: <Trash className="w-5 fill-error stroke-error" />,
        danger: true,
        // disabled: true, // TODO finish object deletion
        onClick: () => deleteObjectMutation({ uid: objectUid }),
      },
    ],
    [deleteObjectMutation, objectType, objectUid],
  );

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
              disabled={!navigateToPreviousPanelObject}
              onClick={navigateToPreviousPanelObject}
            />
          )}
          {!isPage && (
            <Button
              Icon={<ExternalLink className="text-gray-300" />}
              disabled
              variant="ghost"
              href={`/object/${objectType}/${objectUid}`}
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

        {closePanel && (
          <Button variant="ghost" onClick={closePanel}>
            Close
          </Button>
        )}
      </div>
      <div className="flex flex-col items-start pb-2">
        <h1 className="w-full flex-grow truncate text-ellipsis text-lg font-bold uppercase md:text-xl">
          {title}
        </h1>
        {object && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <Pill
              bgColor={object.config.colour}
              className="w-20 bg-brand-primary"
              label={object.config.objectTypeDisplayName || objectType}
            />
            {isTranslatable && (
              <LanguageSelect
                selected={language || object.meta.language}
                variant="pill"
                languages={
                  object.meta.availableLanguages || [object.meta.language]
                }
                onChange={(val) => setLanguage(val)}
              />
            )}
          </div>
        )}
        <div className="flex flex-row items-end justify-end space-x-2">
          {inEditMode && (
            <div className="absolute left-1/2 -bottom-16 z-10 -translate-x-1/2 md:-bottom-18">
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
      </AnimatePresence>
    </div>
  );
};
