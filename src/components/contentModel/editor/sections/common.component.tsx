import clsx from "clsx";
import { ReactNode } from "react";
import { FiInfo, FiPlus } from "react-icons/fi";

import { Tooltip } from "src/components/tooltip/tooltip.component";
import {
  InputFieldWithFieldConfig,
  ParsedSkylarkObjectTypeRelationshipConfiguration,
} from "src/interfaces/skylark";

export type FieldSectionID = "system" | "translatable" | "global";

export type FieldSectionObject = Record<
  "system" | "translatable" | "global",
  { title: string; fields: InputFieldWithFieldConfig[] }
>;

export interface ContentModelEditorForm {
  fieldSections: FieldSectionObject;
  uiConfig: {
    objectTypeDisplayName: string;
    primaryField: string | undefined | null;
    colour: string | undefined | null;
  };
  relationshipConfig?: ParsedSkylarkObjectTypeRelationshipConfiguration;
}

export const uiDisplayFieldTooltip =
  "A config property that instructs the UI which field it should use when displaying an object on listing pages.";

export const InfoTooltip = ({ tooltip }: { tooltip: ReactNode }) => (
  <Tooltip tooltip={tooltip}>
    <div className="ml-1">
      <FiInfo className="text-base" />
    </div>
  </Tooltip>
);

export const SectionWrapper = (props: { children: ReactNode }) => (
  <section {...props} className="my-10 border-t pt-10" />
);

export const SectionHeader = ({ children }: { children: ReactNode }) => (
  <h3 className="text-xl mb-1">{children}</h3>
);

export const SectionDescription = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-manatee-500 mb-2">{children}</p>
);

export const FieldHeader = ({
  children,
  className,
  tooltip,
}: {
  children: ReactNode;
  className?: string;
  tooltip?: ReactNode;
}) => (
  <div className={clsx("flex items-center whitespace-pre", className)}>
    <p>{children}</p>
    {tooltip && <InfoTooltip tooltip={tooltip} />}
  </div>
);

export const AddNewButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="my-2 bg-white border shadow border-manatee-300 rounded-lg items-center h-14 px-2 flex w-full justify-center"
    >
      <FiPlus className="text-xl" />
      <p>Add new</p>
    </button>
  );
};
