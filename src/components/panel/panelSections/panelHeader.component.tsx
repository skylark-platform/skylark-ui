import { OperationVariables, useMutation } from "@apollo/client";
import { Menu } from "@headlessui/react";
import { AnimatePresence } from "framer-motion";
import { DocumentNode } from "graphql";
import { useMemo, useState } from "react";
import { GrGraphQl } from "react-icons/gr";

import { Button } from "src/components/button";
import {
  DisplayGraphQLQuery,
  DisplayGraphQLQueryModal,
} from "src/components/displayGraphQLQuery";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import {
  Cog,
  Edit,
  Expand,
  Trash,
  Cross,
  MoreVertical,
} from "src/components/icons";
import { Pill } from "src/components/pill";
import { useDeleteObject } from "src/hooks/useDeleteObject";
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
        Icon: <GrGraphQl className="text-lg" />,
        onClick: () => setGraphQLModalOpen(true),
      },
      {
        id: "delete-object",
        text: `Delete ${objectType}`,
        Icon: <Trash className="w-5 fill-error stroke-error" />,
        danger: true,
        disabled: true,
        onClick: deleteObject,
      },
    ],
    [deleteObject, objectType],
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
          <DropdownMenu
            options={objectMenuOptions}
            className="text-sm font-bold"
          >
            <DropdownMenuButton className="focus:outline-none focus-visible:ring-2 group-hover:text-black">
              <MoreVertical className="h-5 w-5" />
            </DropdownMenuButton>
          </DropdownMenu>

          {inEditMode ? (
            <>
              <Button variant="primary" success onClick={save}>
                Save
              </Button>
              <Button variant="outline" danger onClick={toggleEditMode}>
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
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 rounded bg-black py-1 px-4 text-sm text-white">
              Editing
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
