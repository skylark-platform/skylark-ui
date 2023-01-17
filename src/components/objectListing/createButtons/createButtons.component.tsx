import clsx from "clsx";

import { Button } from "src/components/button";

interface CreateButtonProps {
  className?: string;
}

export const CreateButtons = ({ className }: CreateButtonProps) => (
  <div className={clsx("flex flex-row gap-4", className)}>
    {/* TODO add Create functionality, change import to "outline" variant */}
    {/* <Button variant="primary">Create</Button> */}
    <Button variant="primary" href="/import/csv">
      Import
    </Button>
  </div>
);
