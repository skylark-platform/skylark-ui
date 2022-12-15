import { Button } from "src/components/button";

export const CreateButtons = () => (
  <div className="flex flex-row gap-4">
    <Button variant="primary">Create</Button>
    <Button variant="outline" href="/import/csv">
      Import
    </Button>
  </div>
);
