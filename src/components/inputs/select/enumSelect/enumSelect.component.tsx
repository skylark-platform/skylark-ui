import { forwardRef, Ref, useMemo } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import { useSkylarkSchemaEnums } from "src/hooks/useSkylarkSchemaEnums";

type EnumSelectProps = Omit<SelectProps, "options">;

export const EnumSelect = forwardRef(
  (
    { ...props }: EnumSelectProps,
    ref: Ref<HTMLButtonElement | HTMLInputElement>,
  ) => {
    const { enums } = useSkylarkSchemaEnums();

    const options: SelectOption[] = useMemo(
      () =>
        enums?.map(({ name, enumValues }) => ({
          value: name,
          label: name,
          description: enumValues.map(({ name }) => name).join(", "),
        })) || [],
      [enums],
    );

    return (
      <Select
        {...props}
        disabled={options.length === 0 || props.disabled}
        placeholder={props.placeholder || "Enum"}
        options={options}
        ref={ref}
      />
    );
  },
);
EnumSelect.displayName = "EnumSelect";
