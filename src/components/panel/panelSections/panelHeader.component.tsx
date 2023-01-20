import { Button } from "src/components/button";
import { Expand } from "src/components/icons";
import { Pill } from "src/components/pill";
import { SkylarkObjectType } from "src/interfaces/skylark/objects";

interface PanelHeaderProps {
  title: string;
  objectType: SkylarkObjectType;
  closePanel: () => void;
}

export const PanelHeader = ({
  title,
  objectType,
  closePanel,
}: PanelHeaderProps) => (
  <div data-testid="panel-header" className="p-4 pb-2 md:p-8 md:py-6">
    <div className="flex flex-row pb-2">
      <div className="flex flex-grow items-center gap-4">
        <Button disabled variant="primary">
          Edit metadata
        </Button>
        <Button
          Icon={<Expand className="stroke-gray-300" />}
          disabled
          variant="ghost"
        />
      </div>

      <Button variant="ghost" onClick={closePanel}>
        Close
      </Button>
    </div>
    <div className="flex flex-row items-center pt-4">
      <Pill bgColor="#226DFF" label={objectType} />
      <h1 className="pl-4 text-xl font-bold uppercase">{title}</h1>
    </div>
  </div>
);
