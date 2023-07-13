import { Pill } from "src/components/pill/pill.component";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectType } from "src/interfaces/skylark";

interface ObjectTypePillProps {
  type: SkylarkObjectType;
  className?: string;
}

export const ObjectTypePill = ({ type, className }: ObjectTypePillProps) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { config } = objectTypesWithConfig?.find(
    ({ objectType }) => objectType === type,
  ) || { config: null };

  return (
    <Pill
      label={config?.display_name || type}
      bgColor={config?.colour}
      className={className}
    />
  );
};
