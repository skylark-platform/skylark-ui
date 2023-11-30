import { IntrospectionEnumType, IntrospectionQuery } from "graphql";
import { useCallback } from "react";

import { useSkylarkSchemaIntrospection } from "./useSkylarkSchemaIntrospection";

const enumsToIgnore = [
  "SkylarkBackgroundTaskStatus",
  "OrderDirections",
  "TypoTolerance",
  "VisibleObjectTypes",
  "PublishStage",
  "UIFieldTypes",
  "FieldTypes",
  "ConfigurationOperations",
  "PlaybackParentObjectTypes",
  "__TypeKind",
  "__DirectiveLocation",
];

export const useSkylarkSchemaEnums = () => {
  const { data: enums } = useSkylarkSchemaIntrospection(
    useCallback(
      (d: IntrospectionQuery) =>
        d.__schema.types.filter(
          (type): type is IntrospectionEnumType =>
            type.kind === "ENUM" && !enumsToIgnore.includes(type.name),
        ),
      [],
    ),
  );
  return {
    enums,
  };
};
