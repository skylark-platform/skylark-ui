import { forwardRef, Ref } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import {
  ObjectTypeWithConfig,
  useSkylarkObjectTypesWithConfig,
  useSkylarkSetObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  SkylarkObjectType,
} from "src/interfaces/skylark";

type ObjectTypeSelectProps = Omit<
  SelectProps<string>,
  "options" | "onChange"
> & {
  onChange: (v: {
    objectType: SkylarkObjectType;
    config?: ParsedSkylarkObjectConfig;
  }) => void;
  hiddenObjectTypes?: SkylarkObjectType[];
};

const createOptions = (
  objectTypesWithConfig?: ObjectTypeWithConfig[],
  hiddenObjectTypes?: string[],
): SelectOption<string>[] =>
  objectTypesWithConfig
    ?.filter(
      ({ objectType }) =>
        !hiddenObjectTypes || !hiddenObjectTypes.includes(objectType),
    )
    .map(({ objectType, config }) => ({
      value: objectType,
      label: config?.objectTypeDisplayName || objectType,
    })) || [];

export const ObjectTypeSelect = forwardRef(
  (
    { hiddenObjectTypes, ...props }: ObjectTypeSelectProps,
    ref: Ref<HTMLButtonElement | HTMLInputElement>,
  ) => {
    const { objectTypesWithConfig, objectTypesConfig } =
      useSkylarkObjectTypesWithConfig();

    const options: SelectOption<string>[] = createOptions(
      objectTypesWithConfig,
      hiddenObjectTypes,
    );

    const onChangeWrapper = (value: string) => {
      const config = objectTypesConfig?.[value];
      props.onChange({
        objectType: value,
        config,
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

export const SetObjectTypeSelect = forwardRef(
  (
    { hiddenObjectTypes, ...props }: ObjectTypeSelectProps,
    ref: Ref<HTMLButtonElement | HTMLInputElement>,
  ) => {
    const { objectTypesWithConfig, objectTypesConfig } =
      useSkylarkSetObjectTypesWithConfig();

    const options: SelectOption<string>[] = createOptions(
      objectTypesWithConfig,
      hiddenObjectTypes,
    );

    const onChangeWrapper = (value: string) => {
      const config = objectTypesConfig?.[value];
      props.onChange({
        objectType: value,
        config,
      });
    };

    return (
      <Select
        {...props}
        disabled={options.length === 0 || props.disabled}
        placeholder={props.placeholder || "Set Type"}
        options={options}
        ref={ref}
        onChange={onChangeWrapper}
      />
    );
  },
);
SetObjectTypeSelect.displayName = "SetObjectTypeSelect";
