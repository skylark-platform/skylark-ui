import { FiZap } from "react-icons/fi";

import { Pill } from "src/components/pill/pill.component";
import { useSkylarkObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";

interface ObjectTypePillProps {
  type: SkylarkObjectType;
  hasDynamicContent?: ParsedSkylarkObjectMeta["hasDynamicContent"];
  defaultConfig?: ParsedSkylarkObjectConfig;
  className?: string;
  forceActualName?: boolean;
}

export const ObjectTypePill = ({
  type,
  hasDynamicContent,
  defaultConfig,
  className,
  forceActualName,
}: ObjectTypePillProps) => {
  const { objectTypesConfig } = useSkylarkObjectTypesWithConfig();

  const config = objectTypesConfig?.[type] || defaultConfig;

  return (
    <Pill
      Icon={hasDynamicContent ? FiZap : undefined}
      label={forceActualName ? type : config?.objectTypeDisplayName || type}
      bgColor={config?.colour || undefined}
      className={className}
    />
  );
};
