import clsx from "clsx";
import { Fragment, useState } from "react";
import { FiEdit3, FiPlus, FiUpload } from "react-icons/fi";

import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { CreateObjectModal } from "src/components/modals";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectIdentifier,
  SkylarkObjectType,
} from "src/interfaces/skylark";

interface CreateButtonProps {
  className?: string;
  onObjectCreated?: (o: SkylarkObjectIdentifier) => void;
  preselectedObjectType?: SkylarkObjectType;
}

export const CreateButtons = ({
  className,
  onObjectCreated,
  preselectedObjectType,
}: CreateButtonProps) => {
  const [createObjectModalState, setCreateObjectModalState] = useState<
    false | "all" | "sets-only"
  >(false);

  const createOptions = [
    // {
    //   id: "create-set",
    //   text: "Create Set",
    //   Icon: <FiEdit3 className="text-lg" />,
    //   onClick: () => setCreateObjectModalState("sets-only"),
    // },
    {
      id: "create",
      text: "Create Object",
      Icon: <FiEdit3 className="text-lg" />,
      onClick: () => setCreateObjectModalState("all"),
    },
    {
      id: "import-csv",
      text: "Import (CSV)",
      href: "import/csv",
      Icon: <FiUpload className="text-lg" />,
    },
  ];

  const defaultObjectType =
    createObjectModalState === "sets-only"
      ? BuiltInSkylarkObjectType.SkylarkSet
      : preselectedObjectType;

  return (
    <>
      <div className={clsx("flex flex-row", className)}>
        <Button
          onClick={() => setCreateObjectModalState("sets-only")}
          variant="outline"
          className="mr-2"
          Icon={<FiEdit3 className="text-lg" />}
        >
          <span className="hidden sm:inline">Create Set</span>
        </Button>
        <DropdownMenu options={createOptions} placement="bottom-end">
          <DropdownMenuButton as={Fragment}>
            <Button
              variant="primary"
              Icon={<FiPlus className="stroke-success-content text-xl" />}
            >
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuButton>
        </DropdownMenu>
      </div>
      <CreateObjectModal
        setTypesOnly={createObjectModalState === "sets-only"}
        isOpen={!!createObjectModalState}
        setIsOpen={setCreateObjectModalState}
        onObjectCreated={(obj) => {
          setCreateObjectModalState(false);
          onObjectCreated?.({
            ...obj,
            language: obj.language || "",
          });
        }}
        objectType={defaultObjectType}
      />
    </>
  );
};
