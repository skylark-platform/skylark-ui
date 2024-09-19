import { ReactNode } from "react";
import { FiExternalLink } from "react-icons/fi";

import { Button } from "src/components/button";
import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";
import { formatObjectField } from "src/lib/utils";

export interface InputLabelProps {
  text: string;
  isRequired?: boolean;
  htmlFor?: string;
  href?: string;
  copyValue?: string;
  children?: ReactNode;
  formatText?: boolean;
  language?: string;
}

export const InputLabel = ({
  text,
  isRequired,
  htmlFor,
  href,
  copyValue,
  children,
  language,
  formatText,
}: InputLabelProps) => (
  <div className="mb-2 flex items-center font-bold">
    <label htmlFor={htmlFor}>
      {formatText ? formatObjectField(text) : text}
      {isRequired && <span className="pl-0.5 text-error">*</span>}
      {language && (
        <span className="opacity-50 font-normal">{` (${language})`}</span>
      )}
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
