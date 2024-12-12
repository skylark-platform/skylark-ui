import clsx from "clsx";
import { useRouter } from "next/router";
import { FiChevronDown } from "react-icons/fi";

import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuSection,
} from "src/components/dropdown/dropdown.component";
import { ObjectTypePill } from "src/components/pill";
import {
  useSkylarkSetObjectTypes,
  useSkylarkObjectOperations,
  ObjectTypesConfigObject,
} from "src/hooks/useSkylarkObjectTypes";
import { IntrospectionQueryOptions } from "src/hooks/useSkylarkSchemaIntrospection";
import { ParsedSkylarkObjectConfig } from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import {
  isAvailabilityOrAudienceSegment,
  isSkylarkObjectType,
} from "src/lib/utils";

interface ObjectTypeNavigationProps {
  activeObjectType: string | null;
  schemaVersion: SchemaVersion;
  objectTypesConfig: ObjectTypesConfigObject;
  schemaOpts?: IntrospectionQueryOptions;
}

const createObjectTypeOption = (
  [objectType]: [string, ParsedSkylarkObjectConfig],
  onChange: (objectType: string) => void,
) => ({
  id: objectType,
  text: objectType,
  // Icon: <FiSearch className="text-lg" />,
  onClick: () => onChange(objectType),
});

const createObjectTypeDropdownOptions = (
  objectTypesWithConfig: [string, ParsedSkylarkObjectConfig][],
  validSetObjectTypes: string[],
  onChange: (objectType: string) => void,
) => {
  const setObjectTypes = objectTypesWithConfig.filter(([ot]) =>
    validSetObjectTypes.includes(ot),
  );
  const customObjectTypes = objectTypesWithConfig.filter(
    ([ot]) => !isSkylarkObjectType(ot) && !validSetObjectTypes.includes(ot),
  );
  const skylarkObjectTypes = objectTypesWithConfig.filter(
    ([ot]) =>
      isSkylarkObjectType(ot) &&
      !validSetObjectTypes.includes(ot) &&
      !isAvailabilityOrAudienceSegment(ot),
  );
  const availabilityObjectTypes = objectTypesWithConfig.filter(
    ([ot]) => isSkylarkObjectType(ot) && isAvailabilityOrAudienceSegment(ot),
  );

  const objectTypesDropdownOptions: DropdownMenuSection[] = [
    {
      id: "set-object-types",
      label: "Set Object Types",
      options: setObjectTypes.map((ot) => createObjectTypeOption(ot, onChange)),
    },
    {
      id: "custom-object-types",
      label: "Custom Object Types",
      options: customObjectTypes.map((ot) =>
        createObjectTypeOption(ot, onChange),
      ),
    },
    {
      id: "skylark-object-types",
      label: "Built-in Object Types",
      options: skylarkObjectTypes.map((ot) =>
        createObjectTypeOption(ot, onChange),
      ),
    },
    {
      id: "availability-object-types",
      label: "Availability Object Types",
      options: availabilityObjectTypes.map((ot) =>
        createObjectTypeOption(ot, onChange),
      ),
    },
  ].filter(({ options }) => options.length > 0);

  return objectTypesDropdownOptions;
};

const ObjectTypeOverview = ({
  objectType,
  objectTypeConfig: config,
  schemaOpts,
}: {
  objectType: string;
  objectTypeConfig: ParsedSkylarkObjectConfig;
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
    <div className="flex-col items-start mt-8 border-t pt-4 w-full text-sm text-manatee-600 hidden md:flex">
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
  activeObjectType: urlObjectType,
  objectTypesConfig,
  schemaVersion,
  schemaOpts,
}: ObjectTypeNavigationProps) => {
  const { push } = useRouter();

  const { setObjectTypes } = useSkylarkSetObjectTypes(true, schemaOpts);

  const objectTypesWithConfig = Object.entries(objectTypesConfig);

  const [activeObjectType, objectTypeConfig] = objectTypesWithConfig.find(
    ([ot]) => ot.toLocaleLowerCase() === urlObjectType?.toLocaleLowerCase(),
  ) || [undefined, undefined];

  const onObjectTypeChange = (objectType: string) => {
    push(
      `/content-model/${schemaVersion.version}/${encodeURIComponent(objectType.toLocaleLowerCase())}`,
    );
  };

  const objectTypesDropdownOptions = createObjectTypeDropdownOptions(
    objectTypesWithConfig,
    setObjectTypes || [],
    onObjectTypeChange,
  );

  return (
    <div
      className="flex flex-col text-left items-start grid-cols-1"
      data-testid="content-editor-navigation"
    >
      <DropdownMenu
        options={objectTypesDropdownOptions}
        placement="bottom"
        renderInPortal
        className="w-full"
      >
        <DropdownMenuButton
          className={clsx(
            "relative w-full flex h-full items-center justify-start whitespace-nowrap rounded rounded-b-none border-b border-b-transparent px-4 py-2 font-medium hover:bg-manatee-100 bg-manatee-50 text-black md:py-3",
          )}
          aria-label="Change object type"
        >
          {/* <Button variant="neutral">
            {activeObjectType} <FiChevronDown className="text-xl" />
          </Button> */}
          <span className="w-full text-left">{activeObjectType}</span>
          <FiChevronDown className="text-xl" />
        </DropdownMenuButton>
      </DropdownMenu>
      {objectTypeConfig && activeObjectType && (
        <ObjectTypeOverview
          objectType={activeObjectType}
          objectTypeConfig={objectTypeConfig}
        />
      )}
    </div>
  );
};
