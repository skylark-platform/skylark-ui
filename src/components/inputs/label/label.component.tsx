import { FiExternalLink } from "react-icons/fi";

import { Button } from "src/components/button";
import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";
import { formatObjectField } from "src/lib/utils";

export const InputLabel = ({
  text,
  isRequired,
  htmlFor,
  href,
  copyValue,
}: {
  text: string;
  isRequired?: boolean;
  htmlFor?: string;
  href?: string;
  copyValue?: string;
}) => (
  <label className="mb-2 flex items-center font-bold" htmlFor={htmlFor}>
    {formatObjectField(text)}
    {isRequired && <span className="pl-0.5 text-error">*</span>}
    {href && (
      <Button
        Icon={<FiExternalLink className="text-lg" />}
        className="ml-2 hover:text-brand-primary"
        variant="form"
        href={href}
        newTab
      />
    )}
    <CopyToClipboard
      value={copyValue}
      className="invisible group-hover/input-field:visible"
    />
  </label>
);
