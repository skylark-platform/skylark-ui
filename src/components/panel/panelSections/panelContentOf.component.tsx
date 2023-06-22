import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelFieldTitle,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { useGetObjectContentOf } from "src/hooks/useGetObjectContentOf";
import { useSkylarkSetObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
  ParsedSkylarkObjectMetadata,
} from "src/interfaces/skylark";
import {
  formatObjectField,
  getObjectTypeDisplayNameFromParsedObject,
  hasProperty,
} from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  inEditMode: boolean;
  language: string;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

const groupContentOfByObjectType = (objects?: ParsedSkylarkObject[]) => {
  return (
    objects?.reduce(
      (acc: { [key: string]: ParsedSkylarkObject[] }, currentValue) => {
        if (acc && acc[currentValue.objectType])
          return {
            ...acc,
            [currentValue.objectType]: [
              ...acc[currentValue.objectType],
              currentValue,
            ],
          };
        return {
          ...acc,
          [currentValue.objectType]: [currentValue],
        };
      },
      {},
    ) || {}
  );
};

const groupObjectsByType = (objects?: ParsedSkylarkObject[]) => {
  return (
    objects?.reduce(
      (acc: Record<string, ParsedSkylarkObject[]>, currentValue) => {
        if (!hasProperty(currentValue.metadata, "type")) {
          return acc;
        }
        const property = currentValue.metadata.type as string;
        if (hasProperty(acc, property))
          return {
            ...acc,
            [property]: [...acc[property], currentValue],
          };
        return {
          ...(acc as Record<string, ParsedSkylarkObject[]>),
          [property]: [currentValue],
        };
      },
      {} as Record<string, ParsedSkylarkObject[]>,
    ) || {}
  );
};

export const PanelContentOf = ({
  isPage,
  objectType,
  uid,
  inEditMode,
  language,
  setPanelObject,
}: PanelRelationshipsProps) => {
  const { objectTypesWithConfig: setObjectTypes } =
    useSkylarkSetObjectTypesWithConfig();

  const { data, isLoading, query, variables } = useGetObjectContentOf(
    objectType,
    uid,
    { language },
  );

  const objectTypeGroupedData = groupContentOfByObjectType(data);

  console.log({ objectTypeGroupedData });

  const objectTypes = Object.keys(objectTypeGroupedData);

  const sections = setObjectTypes?.map(({ objectType, config }) => {
    return {
      objectType,
      id: `content-of-panel-${objectType}`,
      title: formatObjectField(config?.display_name || objectType),
    };
  });

  return (
    <PanelSectionLayout
      sections={sections || []}
      isPage={isPage}
      withStickyHeaders
    >
      {sections?.map(({ objectType, title, id }) => {
        const objectsGroupedByTypeField = groupObjectsByType(
          objectTypeGroupedData[objectType],
        );
        console.log({ objectsGroupedByTypeField });
        return (
          <div key={id} className="relative mb-8">
            <PanelSectionTitle text={title} id={id} sticky />
            {!hasProperty(objectTypeGroupedData, objectType) ||
              (objectTypeGroupedData[objectType].length === 0 && (
                <div className="mt-2">
                  <PanelEmptyDataText />
                </div>
              ))}
            {Object.keys(objectsGroupedByTypeField).map((type) => (
              <div key={type} className="mb-4">
                <PanelFieldTitle
                  sticky
                  text={formatObjectField(type)}
                  count={objectsGroupedByTypeField[type].length}
                />
                {objectsGroupedByTypeField[type].map((object) => (
                  <ObjectIdentifierCard
                    key={object.uid}
                    object={object}
                    onForwardClick={setPanelObject}
                    disableForwardClick={inEditMode}
                  />
                ))}
              </div>
            ))}
          </div>
        );
      })}
      <PanelLoading isLoading={isLoading} />
      <DisplayGraphQLQuery
        label="Get Object Content Of"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
    </PanelSectionLayout>
  );
};
