import { forwardRef, Ref, useMemo } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import { useSkylarkSchemaEnums } from "src/hooks/useSkylarkSchemaEnums";

type EnumSelectProps = Omit<SelectProps<string>, "options">;

export const EnumSelect = forwardRef(
  (
    { ...props }: EnumSelectProps,
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
