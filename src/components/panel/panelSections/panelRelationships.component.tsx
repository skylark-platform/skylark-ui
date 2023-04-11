import { useState } from "react";

import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { useGetObjectRelationships } from "src/hooks/useGetObjectRelationships";
import {
  SkylarkObjectIdentifier,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelRelationshipsProps {
  isPage?: boolean;
  objectType: SkylarkObjectType;
  uid: string;
  language: string;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
}

export const PanelRelationships = ({
  isPage,
  objectType,
  uid,
  language,
  setPanelObject,
}: PanelRelationshipsProps) => {
  const {
    data: relationships,
    isLoading,
    query,
    variables,
  } = useGetObjectRelationships(objectType, uid, {
    language,
  });
  const [expandedRelationships, setExpandedRelationships] = useState<
    Record<string, boolean>
  >({});

  return (
    <PanelSectionLayout
      sections={relationships.map(({ relationshipName }) => ({
        id: `relationship-panel-${relationshipName}`,
        title: formatObjectField(relationshipName),
      }))}
      isPage={isPage}
    >
      <div>
        {relationships &&
          relationships.map((relationship) => {
            const { relationshipName, objects } = relationship;
            const isExpanded = expandedRelationships[relationshipName];

            const displayList =
              objects?.length > 2 && !isExpanded
                ? objects.slice(0, 3)
                : objects;

            return (
              <div key={relationshipName} className="relative mb-8">
                <PanelSectionTitle
                  text={formatObjectField(relationshipName)}
                  count={(objects.length >= 50 ? "50+" : objects.length) || 0}
                  id={`relationship-panel-${relationshipName}`}
                />

                <div className="transition duration-300 ease-in-out">
                  {relationship && displayList?.length > 0 ? (
                    displayList?.map((obj, index) => (
                      <>
                        <ObjectIdentifierCard
                          key={obj.uid}
                          object={obj}
                          onForwardClick={setPanelObject}
                        />
                        {index < displayList.length - 1 && <PanelSeparator />}
                      </>
                    ))
                  ) : (
                    <PanelEmptyDataText />
                  )}
                </div>

                {relationship && objects.length > 3 && (
                  <div className="mb-3">
                    <PanelSeparator />
                    <button
                      data-testid={`expand-relationship-${relationshipName}`}
                      onClick={() =>
                        setExpandedRelationships({
                          [relationshipName]: !isExpanded,
                        })
                      }
                      className="w-full cursor-pointer p-2 text-center text-xs text-manatee-500 hover:text-manatee-700"
                    >
                      {`Show ${isExpanded ? "less" : "more"}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <PanelLoading isLoading={isLoading} />
      <DisplayGraphQLQuery
        label="Get Object Relationships"
        query={query}
        variables={variables}
        buttonClassName="absolute right-2 top-0"
      />
    </PanelSectionLayout>
  );
};
