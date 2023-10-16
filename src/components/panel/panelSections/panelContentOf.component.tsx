import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
} from "src/components/panel/panelTypography";
import { Skeleton } from "src/components/skeleton";
import { useGetObjectContentOf } from "src/hooks/objects/get/useGetObjectContentOf";
import { useSkylarkSetObjectTypesWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  SkylarkObjectIdentifier,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

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

  const sections =
    Object.keys(objectTypeGroupedData).length > 0
      ? setObjectTypes
          ?.map(({ objectType, config }) => {
            return {
              objectType,
              id: `content-of-panel-${objectType}`,
              title: formatObjectField(
                config?.objectTypeDisplayName || objectType,
              ),
              objects: objectTypeGroupedData[objectType],
            };
          })
          .filter(({ objects }) => objects && objects.length > 0)
      : [];

  return (
    <PanelSectionLayout
      sections={sections || []}
      isPage={isPage}
      withStickyHeaders={sections && sections?.length > 0}
    >
      {!isLoading && sections?.length === 0 && (
        <div className="mt-2">
          <PanelEmptyDataText />
        </div>
      )}
      {sections?.map(({ title, id, objects }) => {
        return (
          <div key={id} className="relative mb-8">
            <PanelSectionTitle text={title} id={id} sticky />
            {objects.map((object) => (
              <ObjectIdentifierCard
                key={object.uid}
                object={object}
                onForwardClick={setPanelObject}
                disableForwardClick={inEditMode}
              />
            ))}
          </div>
        );
      })}
      <PanelLoading isLoading={isLoading}>
        {Array.from({ length: 2 }, (_, i) => (
          <div key={`content-of-skeleton-${i}`} className="mb-8">
            <Skeleton className="mb-4 h-6 w-52" />
            <Skeleton className="mb-2 h-5 w-36" />
            {Array.from({ length: 3 }, (_, j) => (
              <Skeleton
                key={`content-of-skeleton-inner-${i}-${j}`}
                className="mb-2 h-11 w-full max-w-xl"
              />
            ))}
          </div>
        ))}
      </PanelLoading>
      <DisplayGraphQLQuery
        label="Get Object Content Of"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
    </PanelSectionLayout>
  );
};
