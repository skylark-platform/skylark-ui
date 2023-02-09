import clsx from "clsx";
import { Fragment } from "react";

import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { Edit3, Plus, Upload } from "src/components/icons";

interface CreateButtonProps {
  className?: string;
}

const createOptions = [
  {
    id: "create",
    text: "Create",
    disabled: true,
    Icon: <Edit3 className="h-5" />,
  },
  {
    id: "import-csv",
    text: "Import (CSV)",
    href: "import/csv",
    Icon: <Upload className="h-5" />,
  },
];

export const CreateButtons = ({ className }: CreateButtonProps) => (
  <div className={clsx("flex flex-row gap-4", className)}>
    <DropdownMenu options={createOptions} align="right">
      <DropdownMenuButton as={Fragment}>
        <Button
          variant="primary"
          Icon={<Plus className="h-4 w-4 stroke-success-content" />}
          className="max-sm:min-w-0 max-sm:px-2"
        >
          <span className="hidden sm:block">Create</span>
        </Button>
      </DropdownMenuButton>
    </DropdownMenu>
  </div>
);
