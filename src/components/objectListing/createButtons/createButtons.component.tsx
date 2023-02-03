import clsx from "clsx";

import { Button } from "src/components/button";
import { Plus } from "src/components/icons";

interface CreateButtonProps {
  className?: string;
}

export const CreateButtons = ({ className }: CreateButtonProps) => (
  <div className={clsx("flex flex-row gap-4", className)}>
    {/* TODO add Create functionality, change import to "outline" variant */}
    {/* <Button variant="primary">Create</Button> */}
    <Button
      variant="primary"
      Icon={<Plus className="h-4 w-4 stroke-success-content" />}
      href="/import/csv"
    >
      Import
    </Button>
  </div>
);
