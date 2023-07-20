import { forwardRef, Ref } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  SkylarkObjectType,
} from "src/interfaces/skylark";

type ObjectTypeSelectProps = Omit<SelectProps, "options" | "onChange"> & {
  onChange: (v: {
    objectType: SkylarkObjectType;
    config?: ParsedSkylarkObjectConfig;
  }) => void;
};

export const ObjectTypeSelect = forwardRef(
  (
    { ...props }: ObjectTypeSelectProps,
    ref: Ref<HTMLButtonElement | HTMLInputElement>,
  ) => {
    const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

    const options: SelectOption[] =
      objectTypesWithConfig?.map(({ objectType, config }) => ({
        value: objectType,
        label: config?.objectTypeDisplayName || objectType,
      })) || [];

    const onChangeWrapper = (value: string) => {
      const objectTypeWithConfig = objectTypesWithConfig?.find(
        ({ objectType }) => objectType === value,
      );
      props.onChange({
        objectType: value,
        config: objectTypeWithConfig?.config,
      });
    };

    return (
      <Select
        {...props}
        disabled={options.length === 0 || props.disabled}
        placeholder={props.placeholder || "Object Type"}
        options={options}
        ref={ref}
        onChange={onChangeWrapper}
        buttonClassName="rounded-sm"
      />
    );
  },
);
ObjectTypeSelect.displayName = "ObjectTypeSelect";
