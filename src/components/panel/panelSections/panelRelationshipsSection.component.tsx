import { useState, Fragment } from "react";
import { sentenceCase } from "sentence-case";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  PanelPlusButton,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { PanelTab, PanelTabState } from "src/hooks/state";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectRelationship,
  ParsedSkylarkObjectTypeRelationshipConfiguration,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { formatObjectField, hasProperty } from "src/lib/utils";

interface PanelRelationshipsSectionProps {
  isEmptySection?: boolean;
  relationship: ParsedSkylarkObjectRelationship;
  inEditMode: boolean;
  newUids: string[];
  initialExpanded: boolean;
  config: ParsedSkylarkObjectTypeRelationshipConfiguration["config"] | null;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  removeRelationshipObject: (args: {
    uid: string;
    relationshipName: string;
  }) => void;
  setSearchObjectsModalState: (args: {
    relationship: ParsedSkylarkObjectRelationship;
    fields?: string[];
  }) => void;
  updateActivePanelTabState: (s: Partial<PanelTabState>) => void;
}

export const PanelRelationshipSection = ({
  isEmptySection,
  relationship,
  inEditMode,
  newUids,
  initialExpanded,
  config,
  setPanelObject,
  removeRelationshipObject,
  setSearchObjectsModalState,
  updateActivePanelTabState,
}: PanelRelationshipsSectionProps) => {
  const { name: relationshipName, objects, objectType } = relationship;

  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggleExpanded = () => {
    updateActivePanelTabState({
      [PanelTab.Relationships]: {
        expanded: { [relationshipName]: !isExpanded },
      },
    });
    setIsExpanded(!isExpanded);
  };

  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const objectFields = objectOperations?.fields.map(({ name }) => name);

  const displayList =
    objects?.length > 2 && !isExpanded ? objects.slice(0, 3) : objects;

  return (
    <div
      key={relationshipName}
      className="relative mb-6"
      data-testid={relationshipName}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PanelSectionTitle
            text={formatObjectField(relationshipName)}
            count={objects.length || 0}
            id={`relationship-panel-${relationshipName}`}
          />
          <PanelPlusButton
            onClick={() =>
              setSearchObjectsModalState({ relationship, fields: objectFields })
            }
          />
        </div>
        {!isEmptySection && config?.defaultSortField && (
          <p className="text-manatee-300 text-xs mb-4 hover:text-manatee-600 transition-colors cursor-default">{`Sorted by: ${sentenceCase(
            config.defaultSortField,
          )}`}</p>
        )}
      </div>

      <div className="transition duration-300 ease-in-out">
        {displayList?.length > 0 ? (
          displayList?.map((obj, index) => {
            const defaultSortFieldValue =
              config?.defaultSortField &&
              hasProperty(obj.metadata, config.defaultSortField) &&
              obj.metadata[config.defaultSortField];

            return (
              <Fragment key={`relationship-${obj.objectType}-${obj.uid}`}>
                <div
                  className="flex items-center"
                  data-testid={`panel-relationship-${relationshipName}-item-${
                    index + 1
                  }`}
                >
                  <ObjectIdentifierCard
                    object={obj}
                    disableDeleteClick={!inEditMode}
                    disableForwardClick={inEditMode}
                    onDeleteClick={() =>
                      removeRelationshipObject({
                        uid: obj.uid,
                        relationshipName,
                      })
                    }
                    onForwardClick={setPanelObject}
                  >
                    {config?.defaultSortField && (
                      <Tooltip
                        tooltip={`${sentenceCase(
                          config.defaultSortField,
                        )}: ${defaultSortFieldValue}`}
                      >
                        <p
                          className="flex max-w-8 min-w-3 overflow-hidden whitespace-nowrap text-sm text-manatee-500 cursor-default"
                          data-testid="object-sort-field"
                        >
                          <span className="overflow-hidden text-ellipsis">
                            {defaultSortFieldValue}
                          </span>
                        </p>
                      </Tooltip>
                    )}
                    {inEditMode && newUids?.includes(obj.uid) && (
                      <span
                        className={
                          "flex h-4 w-4 items-center justify-center rounded-full bg-success px-1 pb-0.5 text-center text-white transition-colors"
                        }
                      />
                    )}
                  </ObjectIdentifierCard>
                </div>

                {index < displayList.length - 1 && <PanelSeparator />}
              </Fragment>
            );
          })
        ) : (
          <></>
        )}
      </div>

      {relationship && objects.length > 3 && (
        <div className="mb-3">
          <PanelSeparator />
          <button
            data-testid={`expand-relationship-${relationshipName}`}
            onClick={toggleExpanded}
            className="w-full cursor-pointer p-2 text-center text-xs text-manatee-500 hover:text-manatee-700"
          >
            {`Show ${isExpanded ? "less" : "more"}`}
          </button>
        </div>
      )}
    </div>
  );
};
