import clsx from "clsx";
import { useMemo } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import { useUser } from "src/contexts/useUser";

// Downloaded from https://datahub.io/core/language-codes "ietf-language-tags"
import IetfLanguageTags from "./ietf-language-tags.json";

type LanguageSelectProps = Omit<SelectProps, "placeholder" | "options"> & {
  languages?: string[];
};

const defaultOptions: SelectOption[] = IetfLanguageTags.map(
  ({ lang }): SelectOption => ({ value: lang, label: lang }),
);

const arrIndexOrMaxValue = (arr: string[], value: string): number => {
  const valIndex = arr.indexOf(value);
  return valIndex > -1 ? valIndex : Number.MAX_VALUE;
};

export const LanguageSelect = ({
  languages,
  ...props
}: LanguageSelectProps) => {
  const { usedLanguages } = useUser();

  const options: SelectOption[] = useMemo(() => {
    const unsortedOptions = languages
      ? languages.map((lang) => ({ value: lang, label: lang }))
      : defaultOptions;

    if (usedLanguages && usedLanguages.length > 0) {
      const sortedLanguages = unsortedOptions.sort(
        ({ value: a }, { value: b }) =>
          arrIndexOrMaxValue(usedLanguages, a) -
          arrIndexOrMaxValue(usedLanguages, b),
      );
      return sortedLanguages;
    }

    return unsortedOptions;
  }, [languages, usedLanguages]);

  return (
    <Select
      {...props}
      options={options}
      className={clsx(props.variant === "pill" ? "w-28" : props.className)}
      placeholder="Language"
      rounded={props.rounded === undefined ? true : props.rounded}
      searchable={props.variant !== "pill"}
    />
  );
};
