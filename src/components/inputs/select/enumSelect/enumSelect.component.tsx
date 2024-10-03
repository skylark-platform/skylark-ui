import { IntrospectionEnumType } from "graphql";
import { forwardRef, Ref, useCallback, useMemo } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import { useSkylarkSchemaEnums } from "src/hooks/useSkylarkSchemaEnums";

type EnumSelectProps = Omit<SelectProps<string>, "options" | "onChange"> & {
  onChange: (e: IntrospectionEnumType) => void;
};

export const EnumSelect = forwardRef(
  (
    { onChange, ...props }: EnumSelectProps,
    ref: Ref<HTMLButtonElement | HTMLInputElement>,
  ) => {
    const { enums } = useSkylarkSchemaEnums();

    const options: SelectOption<string>[] = useMemo(
      () =>
        enums?.map(({ name, enumValues }) => ({
          value: name,
          label: name,
          infoTooltip: (
            <div className="z-[51]">
              <p className="font-medium -ml-1 mb-1">Enum values:</p>
              <ul className="pl-2">
                {enumValues.map(({ name }) => (
                  <li key={name} className="list-disc">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ),
        })) || [],
      [enums],
    );

    const onChangeWrapper = useCallback(
      (value: string) => {
        const newEnum = enums?.find((e) => e.name === value);
        if (newEnum) {
          onChange(newEnum);
        }
      },
      [enums, onChange],
    );

    return (
      <Select
        {...props}
        onChange={onChangeWrapper}
        disabled={options.length === 0 || props.disabled}
        placeholder={props.placeholder || "Enum"}
        options={options}
        ref={ref}
      />
    );
  },
);
EnumSelect.displayName = "EnumSelect";
