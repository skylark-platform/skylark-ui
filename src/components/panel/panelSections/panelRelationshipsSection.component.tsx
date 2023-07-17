import { useState, Fragment } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  PanelPlusButton,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectRelationships,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface PanelRelationshipsSectionProps {
  relationship: ParsedSkylarkObjectRelationships;
  inEditMode: boolean;
  newUids: string[];
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  removeRelationshipObject: (args: {
    uid: string;
    relationshipName: string;
  }) => void;
  setSearchObjectsModalState: (args: {
    relationship: ParsedSkylarkObjectRelationships;
    fields?: string[];
  }) => void;
}

export const PanelRelationshipSection = ({
  relationship,
  inEditMode,
  newUids,
  setPanelObject,
  removeRelationshipObject,
  setSearchObjectsModalState,
}: PanelRelationshipsSectionProps) => {
  const { relationshipName, objects, objectType } = relationship;

  const [isExpanded, setIsExpanded] = useState(false);

  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const objectFields = objectOperations?.fields.map(({ name }) => name);

  const displayList =
    objects?.length > 2 && !isExpanded ? objects.slice(0, 3) : objects;

  return (
    <div key={relationshipName} className="relative mb-6">
      <div className="flex items-center ">
        <PanelSectionTitle
          text={formatObjectField(relationshipName)}
          count={(objects.length >= 50 ? "50+" : objects.length) || 0}
          id={`relationship-panel-${relationshipName}`}
        />
        <PanelPlusButton
          onClick={() =>
            setSearchObjectsModalState({ relationship, fields: objectFields })
          }
        />
      </div>
      <div className="transition duration-300 ease-in-out">
        {displayList?.length > 0 ? (
          displayList?.map((obj, index) => {
            return (
              <Fragment key={`relationship-${obj.objectType}-${obj.uid}`}>
                <div
                  className="flex items-center "
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
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full cursor-pointer p-2 text-center text-xs text-manatee-500 hover:text-manatee-700"
          >
            {`Show ${isExpanded ? "less" : "more"}`}
          </button>
        </div>
      )}
    </div>
  );
};
