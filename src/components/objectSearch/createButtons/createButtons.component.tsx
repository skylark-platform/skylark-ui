import clsx from "clsx";
import { Fragment, useState } from "react";
import { FiUpload } from "react-icons/fi";

import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { Edit3, Plus } from "src/components/icons";
import { CreateObjectModal } from "src/components/modals";
import { SkylarkObjectIdentifier } from "src/interfaces/skylark";

interface CreateButtonProps {
  className?: string;
  onObjectCreated?: (o: SkylarkObjectIdentifier) => void;
}

export const CreateButtons = ({
  className,
  onObjectCreated,
}: CreateButtonProps) => {
  const [createObjectModalOpen, setCreateObjectModalOpen] = useState(false);

  const createOptions = [
    {
      id: "create",
      text: "Create Object",
      Icon: <Edit3 className="h-5" />,
      onClick: () => setCreateObjectModalOpen(true),
    },
    {
      id: "import-csv",
      text: "Import (CSV)",
      href: "import/csv",
      Icon: <FiUpload className="text-xl" />,
    },
  ];

  return (
    <>
      <div className={clsx("flex flex-row", className)}>
        <DropdownMenu options={createOptions} align="right">
          <DropdownMenuButton as={Fragment}>
            <Button
              variant="primary"
              Icon={<Plus className="h-4 w-4 stroke-success-content" />}
            >
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
          onObjectCreated?.(obj);
        }}
      />
    </>
  );
};
