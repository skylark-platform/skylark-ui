import clsx from "clsx";
import { ReactNode } from "react";
import { FiInfo } from "react-icons/fi";

import { Tooltip } from "src/components/tooltip/tooltip.component";
import { InputFieldWithFieldConfig } from "src/interfaces/skylark";

export type FieldSectionID = "system" | "translatable" | "global";

export type FieldSectionObject = Record<
  "system" | "translatable" | "global",
  { title: string; fields: InputFieldWithFieldConfig[] }
>;

export interface ContentModelEditorForm {
  fieldSections: FieldSectionObject;
  objectTypeDisplayName: string;
  primaryField: string | undefined | null;
  colour: string | undefined | null;
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
  <h3 className="text-xl">{children}</h3>
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
