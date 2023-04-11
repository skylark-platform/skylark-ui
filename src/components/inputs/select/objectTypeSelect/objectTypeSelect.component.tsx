import { forwardRef, Ref } from "react";

import {
  Select,
  SelectOption,
  SelectProps,
} from "src/components/inputs/select";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkGraphQLObjectConfig,
  SkylarkObjectType,
} from "src/interfaces/skylark";

type ObjectTypeSelectProps = Omit<SelectProps, "options" | "onChange"> & {
  onChange: (v: {
    objectType: SkylarkObjectType;
    config?: SkylarkGraphQLObjectConfig;
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
        label:
          config && config.display_name ? (
            <>
              {config.display_name}
              <span className="ml-1 text-manatee-300">{`(${objectType})`}</span>
            </>
          ) : (
            objectType
          ),
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
        disabled={!objectTypesWithConfig}
        placeholder={props.placeholder || "Object Type"}
        options={options}
        ref={ref}
        onChange={onChangeWrapper}
      />
    );
  },
);
ObjectTypeSelect.displayName = "ObjectTypeSelect";