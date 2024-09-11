import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { ObjectTypeSelect, Select } from "src/components/inputs/select";
import { ObjectTypePill } from "src/components/pill";
import {
  useSkylarkSetObjectTypes,
  useSkylarkObjectTypesWithConfig,
  ObjectTypeWithConfig,
  useSkylarkObjectOperations,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import { isSkylarkObjectType } from "src/lib/utils";

interface ObjectTypeNavigationProps {
  activeObjectType: string | null;
  schemaOpts?: IntrospectionQueryOptions;
}

const ObjectTypeNavigationSection = ({
  title,
  activeObjectType,
  objectTypesWithConfig,
}: {
  title: string;
  activeObjectType: string | null;
  objectTypesWithConfig?: ObjectTypeWithConfig[];
}) => (
  <div className="flex flex-col justify-start items-start my-4 w-full text-sm">
    <p className="mb-1 text-base">{title}</p>
    {objectTypesWithConfig?.map(({ objectType, config }) => {
      return (
        <Link
          key={objectType}
          className={clsx(
            "my-1 flex items-center w-full",
            activeObjectType?.toLowerCase() === objectType.toLowerCase()
              ? "text-black font-medium"
              : "text-manatee-600",
          )}
          href={`/content-model/${encodeURIComponent(objectType.toLocaleLowerCase())}`}
        >
          <span
            className="w-4 h-4 block rounded mr-1 whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ backgroundColor: config.colour || undefined }}
          />
          {config.objectTypeDisplayName &&
          config.objectTypeDisplayName !== objectType ? (
            <>
              {objectType}{" "}
              <span className="text-manatee-400 block text-ellipsis font-normal ml-1 whitespace-nowrap overflow-hidden">
                ({config.objectTypeDisplayName})
              </span>
            </>
          ) : (
            objectType
          )}
        </Link>
      );
    })}
  </div>
);

const ObjectTypeOverview = ({
  objectTypeWithConfig: { objectType, config },
  schemaOpts,
}: {
  objectTypeWithConfig: ObjectTypeWithConfig;
  schemaOpts?: IntrospectionQueryOptions;
}) => {
  const { objectOperations: objectMeta } = useSkylarkObjectOperations(
    objectType,
    schemaOpts,
  );

  const sections = [
    {
      title: "Fields",
      stats: [
        { id: "fields", text: `Total: ${objectMeta?.fields.length}` },
        {
          id: "translatable-fields",
          text: `Translatable: ${objectMeta?.fieldConfig.translatable.length}`,
        },
        {
          id: "global-fields",
          text: `Global: ${objectMeta?.fieldConfig.global.length}`,
        },
      ],
    },
    {
      title: "Relationships",
      stats: [
        {
          id: "relationships",
          text: `Total: ${objectMeta?.relationships.length}`,
        },
        {
          id: "has-images",
          text: `Images: ${Boolean(objectMeta?.builtinObjectRelationships?.images)}`,
        },
        {
          id: "has-video",
          text: `Video: ${Boolean(objectMeta?.builtinObjectRelationships?.hasAssets)}`,
        },
        {
          id: "has-live-video",
          text: `Live Video: ${Boolean(objectMeta?.builtinObjectRelationships?.hasLiveAssets)}`,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col items-start mt-8 border-t pt-4 w-full text-sm text-manatee-600">
      <h3 className="text-2xl font-semibold text-black">{objectType}</h3>
      <p
        className={clsx(
          "my-1 mt-0.5",
          isSkylarkObjectType(objectType)
            ? "text-brand-primary"
            : "text-brand-primary",
        )}
      >
        {isSkylarkObjectType(objectType) ? "System Object" : "Custom Object"}
      </p>
      <p className="mt-6 mb-2 text-base text-manatee-800 font-semibold">
        Overview
      </p>
      <p className="my-1">
        {`Shown in UI as:`}
        <ObjectTypePill
          type={objectType}
          defaultConfig={config}
          className="ml-1"
        />
      </p>
      {sections.map(({ title, stats }) => (
        <div key={title} className="hidden md:block">
          <p className="mt-4 font-semibold text-manatee-800">{title}</p>
          {stats.map(({ id, text }) => (
            <p key={id} className="my-1">
              {text}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

export const ObjectTypeSelectAndOverview = ({
  activeObjectType,
  schemaOpts,
}: ObjectTypeNavigationProps) => {
  const { push } = useRouter();

  // const { setObjectTypes } = useSkylarkSetObjectTypes(true, schemaOpts);

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig(schemaOpts);

  const selected = objectTypesWithConfig?.find(
    ({ objectType }) =>
      objectType.toLocaleLowerCase() === activeObjectType?.toLocaleLowerCase(),
  );

  // TODO section the list by Sets, Custom, Built in
  // const setObjectTypesWithConfig = objectTypesWithConfig?.filter(
  //   ({ objectType }) => setObjectTypes?.includes(objectType),
  // );
  // const systemObjectTypesWithConfig = objectTypesWithConfig?.filter(
  //   ({ objectType }) =>
  //     isSkylarkObjectType(objectType) && !setObjectTypes?.includes(objectType),
  // );
  // const customObjectTypesWithConfig = objectTypesWithConfig?.filter(
  //   ({ objectType }) =>
  //     !isSkylarkObjectType(objectType) && !setObjectTypes?.includes(objectType),
  // );

  console.log(activeObjectType);

  return (
    <div
      className="flex flex-col text-left items-start grid-cols-1"
      data-testid="content-editor-navigation"
    >
      {/* <Select options={}  /> */}
      <ObjectTypeSelect
        label="Object type"
        labelVariant="header"
        onChange={({ objectType }) =>
          push(
            `/content-model/${encodeURIComponent(objectType.toLocaleLowerCase())}`,
          )
        }
        selected={selected?.objectType || ""}
        variant="primary"
        displayActualName
        className="w-full"
      />
      {selected && <ObjectTypeOverview objectTypeWithConfig={selected} />}
    </div>
  );
};
