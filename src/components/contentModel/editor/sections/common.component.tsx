import clsx from "clsx";
import { ReactNode } from "react";

import { InfoTooltip } from "src/components/tooltip/tooltip.component";
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
