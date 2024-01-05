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
  const [createObjectModalOpen, setCreateObjectModalOpen] = useState(false);

  const createOptions = [
    {
      id: "create",
      text: "Create Object",
      Icon: <FiEdit3 className="text-lg" />,
      onClick: () => setCreateObjectModalOpen(true),
    },
    {
      id: "import-csv",
      text: "Import (CSV)",
      href: "import/csv",
      Icon: <FiUpload className="text-lg" />,
    },
  ];

  return (
    <>
      <div className={clsx("flex flex-row", className)}>
        <DropdownMenu options={createOptions} placement="bottom-end">
          <DropdownMenuButton as={Fragment}>
            <Button variant="primary" Icon={<FiPlus className="text-xl" />}>
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuButton>
        </DropdownMenu>
      </div>
      <CreateObjectModal
        isOpen={createObjectModalOpen}
        setIsOpen={setCreateObjectModalOpen}
        onObjectCreated={(obj) => {
          setCreateObjectModalOpen(false);
          onObjectCreated?.({
            ...obj,
            language: obj.language || "",
          });
        }}
        objectType={preselectedObjectType}
      />
    </>
  );
};
