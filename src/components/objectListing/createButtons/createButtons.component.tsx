import { Button } from "src/components/button";

export const CreateButtons = () => (
  <div className="flex flex-row gap-4">
    {/* TODO add Create functionality, change import to "outline" variant */}
    {/* <Button variant="primary">Create</Button> */}
    <Button variant="primary" href="/import/csv">
      Import
    </Button>
  </div>
);
