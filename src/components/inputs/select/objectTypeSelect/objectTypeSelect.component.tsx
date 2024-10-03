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

type ObjectTypeSelectProps = Omit<
  SelectProps<string>,
  "options" | "onChange" | "placeholder"
> & {
  onChange: (v: {
    objectType: SkylarkObjectType;
    config?: ParsedSkylarkObjectConfig;
  }) => void;
  hiddenObjectTypes?: SkylarkObjectType[];
  placeholder?: string;
  displayActualName?: boolean;
};

const formatLabel = (
  objectType: string,
  config: ParsedSkylarkObjectConfig,
  displayActualName?: boolean,
) => {
  if (displayActualName) {
    return config.objectTypeDisplayName &&
      config.objectTypeDisplayName !== objectType
      ? `${config.objectTypeDisplayName} (${objectType})` // `${objectType} (${config.objectTypeDisplayName})`
      : objectType;
  }

  return config?.objectTypeDisplayName || objectType;
};

export const ObjectTypeSelect = forwardRef(
  (
    { hiddenObjectTypes, displayActualName, ...props }: ObjectTypeSelectProps,
    ref: Ref<HTMLButtonElement | HTMLInputElement>,
  ) => {
    const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

    const options: SelectOption<string>[] =
      objectTypesWithConfig
        ?.filter(
          ({ objectType }) =>
            !hiddenObjectTypes || !hiddenObjectTypes.includes(objectType),
        )
        .map(({ objectType, config }) => ({
          value: objectType,
          label: formatLabel(objectType, config, displayActualName),
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
      />
    );
  },
);
ObjectTypeSelect.displayName = "ObjectTypeSelect";
