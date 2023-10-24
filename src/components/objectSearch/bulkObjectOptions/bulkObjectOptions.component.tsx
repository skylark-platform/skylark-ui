import { useState } from "react";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";

import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { DeleteObjectModal } from "src/components/modals";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

interface BulkObjectOptionsProps {
  selectedObjects: ParsedSkylarkObject[];
}

export const BulkObjectOptions = ({
  selectedObjects,
}: BulkObjectOptionsProps) => {
  console.log({ selectedObjects });

  const [
    deleteObjectConfirmationModalOpen,
    setDeleteObjectConfirmationModalOpen,
  ] = useState(false);

  return (
    <div>
      <DropdownMenu
        options={[
          {
            id: "delete-selected-objects",
            text: "Delete Selected Objects",
            Icon: <FiTrash2 className="stroke-error text-xl" />,
            danger: true,
            // onClick: () => setDeleteObjectConfirmationModalOpen(true),
          },
        ]}
        placement="bottom-end"
      >
        <DropdownMenuButton
          as={Button}
          variant="neutral"
          className="whitespace-nowrap"
          Icon={<FiMoreVertical className="-mr-1 text-2xl" />}
        >
          Bulk Options
        </DropdownMenuButton>
      </DropdownMenu>
    </div>
  );
};
