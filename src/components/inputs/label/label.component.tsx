import { ReactNode } from "react";
import { CgSpinner } from "react-icons/cg";
import { FiExternalLink, FiRefreshCw } from "react-icons/fi";
import { GrMagic } from "react-icons/gr";

import { Button } from "src/components/button";
import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { formatObjectField } from "src/lib/utils";

export interface InputLabelProps {
  text: string;
  isRequired?: boolean;
  htmlFor?: string;
  href?: string;
  copyValue?: string;
  children?: ReactNode;
}

export const InputLabel = ({
  text,
  isRequired,
  htmlFor,
  href,
  copyValue,
  children,
}: InputLabelProps) => (
  <div className="mb-2 flex items-center font-bold">
    <label htmlFor={htmlFor}>
      {formatObjectField(text)}
      {isRequired && <span className="pl-0.5 text-error">*</span>}
    </label>
    {children}
    {href && (
      <Button
        Icon={<FiExternalLink className="text-lg" />}
        className="ml-2 hover:text-brand-primary"
        variant="form-ghost"
        href={href}
        newTab
      />
    )}
    <CopyToClipboard
      value={copyValue}
      className="invisible group-hover/input-field:visible"
    />
  </div>
);
