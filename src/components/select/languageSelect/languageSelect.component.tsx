import clsx from "clsx";

import { Select, SelectOption, SelectProps } from "src/components/select";

// Downloaded from https://datahub.io/core/language-codes "ietf-language-tags"
import IetfLanguageTags from "./ietf-language-tags.json";

type LanguageSelectProps = Omit<SelectProps, "placeholder" | "options"> & {
  languages?: string[];
};

const options: SelectOption[] = IetfLanguageTags.map(
  ({ lang }): SelectOption => ({ value: lang, label: lang }),
);

export const LanguageSelect = ({
  languages,
  ...props
}: LanguageSelectProps) => (
  <Select
    {...props}
    options={
      languages?.map((lang) => ({ value: lang, label: lang })) || options
    }
    className={clsx(props.variant === "pill" ? "w-20" : props.className)}
    placeholder="Language"
    rounded={props.rounded === undefined ? true : props.rounded}
    withSearch={!languages || languages.length > 10}
  />
);
