import { OperationVariables } from "@apollo/client";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { DocumentNode } from "graphql";
import { useMemo, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { GrGraphQl } from "react-icons/gr";

import { Button } from "src/components/button";
import { DisplayGraphQLQueryModal } from "src/components/displayGraphQLQuery";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { Edit, Expand, Trash, MoreVertical } from "src/components/icons";
import { Pill } from "src/components/pill";
import { SkylarkObjectType } from "src/interfaces/skylark";

interface PanelHeaderProps {
  title: string;
  currentTab: string;
  tabsWithEditMode: string[];
  objectType: SkylarkObjectType;
  pillColor?: string;
  graphQLQuery: DocumentNode | null;
  graphQLVariables?: OperationVariables;
  inEditMode: boolean;
  isSaving?: boolean;
  toggleEditMode: () => void;
  closePanel: () => void;
  deleteObject: () => void;
  save: () => void;
}

export const PanelHeader = ({
  title,
  objectType,
  currentTab,
  tabsWithEditMode,
  pillColor,
  graphQLQuery,
  graphQLVariables,
  inEditMode,
  isSaving,
  toggleEditMode,
  closePanel,
  deleteObject,
  save,
}: PanelHeaderProps) => {
  const [showGraphQLModal, setGraphQLModalOpen] = useState(false);

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
        // Disable while no tabs have edit mode TODO remove this check
        disabled: tabsWithEditMode.length === 0,
        onClick: deleteObject,
      },
    ],
    [deleteObject, objectType, tabsWithEditMode],
  );

  return (
    <div
      data-testid="panel-header"
      className="relative p-4 pb-2 md:p-8 md:py-4"
    >
      <div className="flex flex-row pb-2">
        <div className="flex flex-grow items-center gap-4">
          <Button
            Icon={<Expand className="stroke-gray-300" />}
            disabled
            variant="ghost"
          />
          <DropdownMenu options={objectMenuOptions} align="left">
            <DropdownMenuButton
              className="focus:outline-none focus-visible:ring-2 group-hover:text-black"
              aria-label="Open Panel Menu"
            >
              <MoreVertical className="h-5 w-5" />
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

        <Button variant="ghost" onClick={closePanel}>
          Close
        </Button>
      </div>
      <div className="flex flex-row items-center gap-2 pb-2">
        <Pill
          bgColor={pillColor}
          className="bg-brand-primary"
          label={objectType}
        />
        <h1 className="flex-grow text-xl font-bold uppercase">{title}</h1>
        <div className="flex flex-row items-end justify-end gap-2">
          {inEditMode && (
            <div className="absolute left-1/2 -bottom-16 -translate-x-1/2">
              {/* TODO split into label component, isSaving -> loading */}
              <span
                className={clsx(
                  "flex items-center justify-center rounded bg-black py-1 text-xs text-white md:text-sm",
                  isSaving ? "px-2 md:px-3" : "px-3 md:px-4",
                )}
              >
                {isSaving && (
                  <CgSpinner className="mr-1 animate-spin-fast text-sm md:text-base" />
                )}
                {isSaving ? "Saving" : "Editing"}
              </span>
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
