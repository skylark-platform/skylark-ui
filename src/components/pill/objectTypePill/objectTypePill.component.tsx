import { Pill } from "src/components/pill/pill.component";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  SkylarkObjectType,
} from "src/interfaces/skylark";

interface ObjectTypePillProps {
  type: SkylarkObjectType;
  defaultConfig?: ParsedSkylarkObjectConfig;
  className?: string;
  forceActualName?: boolean;
}

export const ObjectTypePill = ({
  type,
  defaultConfig,
  className,
  forceActualName,
}: ObjectTypePillProps) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const { config } = objectTypesWithConfig?.find(
    ({ objectType }) => objectType === type,
  ) || { config: defaultConfig };

  return (
    <Pill
      label={forceActualName ? type : config?.objectTypeDisplayName || type}
      bgColor={config?.colour || undefined}
      className={className}
    />
  );
};
