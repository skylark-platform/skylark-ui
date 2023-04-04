import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { Trash } from "src/components/icons";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { PanelLoading } from "src/components/panel/panelLoading";
import {
  PanelEmptyDataText,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Pill } from "src/components/pill";
import { Toast } from "src/components/toast/toast.component";
import { DROPPABLE_RELATIONSHIPS_ID } from "src/constants/skylark";
import { useGetObjectRelationships } from "src/hooks/useGetObjectRelationships";
import {
  ParsedSkylarkObject,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectRelationship,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface PanelRelationshipsProps {
  objectType: SkylarkObjectType;
  inEditMode: boolean;
  relationshipsToRemove: { [key: string]: string[] } | null;
  setRelationshipsToRemove: (uids: { [key: string]: string[] }) => void;
  uid: string;
  showDropArea?: boolean;
  newRelationships: ParsedSkylarkObject[];
  language: string;
}

const parse = (
  objects: ParsedSkylarkObject[],
  relationships: SkylarkObjectRelationship[],
): { [k: string]: ParsedSkylarkObject[] } => {
  return objects.reduce((acc: { [k: string]: ParsedSkylarkObject[] }, cv) => {
    console.log("relationships", relationships, cv.objectType);
    const key: string | undefined = relationships.find(
      (relationship) => relationship.objectType === cv.objectType,
    )?.relationshipName;

    // at this point i already know that is a valid relationship
    if (key) {
      const current = acc[key] || [];
      return { ...acc, [key]: [...current, cv] };
    }
    return acc;
  }, {});
};

export const PanelRelationships = ({
  objectType,
  uid,
  inEditMode,
  relationshipsToRemove,
  setRelationshipsToRemove,
  language,
  showDropArea,
  newRelationships,
}: PanelRelationshipsProps) => {
  const {
    data: relationshipsData,
    relationships = [],
    isLoading,
    query,
    variables,
  } = useGetObjectRelationships(objectType, uid, { language });

  const [updatedRelationship, updateR] = useState<
    ParsedSkylarkObjectRelationships[] | null
  >(null);

  console.log("updated from server", relationshipsData);

  console.log("updated", updatedRelationship);

  useEffect(() => {
    console.log("updated useeffect", updatedRelationship);
    if (updatedRelationship === null && relationshipsData) {
      updateR(relationshipsData);
    }
  }, [relationshipsData, updatedRelationship]);

  // only removes from saved relations
  const removeItem = (removeUid: string) => {
    // remove
    if (updatedRelationship) {
      const updatedr = updatedRelationship.map((relationship) => {
        const { objects, relationshipName } = relationship;

        const itemToRemove = objects.find((obj) => obj.uid == removeUid);
        if (itemToRemove) {
          console.log("this is nice ", relationshipName);
          console.log("this is nice state", relationshipsToRemove);
          if (relationshipsToRemove && relationshipsToRemove[relationshipName])
            setRelationshipsToRemove({
              ...relationshipsToRemove,
              [relationshipName]: [
                ...relationshipsToRemove[relationshipName],
                removeUid,
              ],
            });
          else if (relationshipsToRemove) {
            setRelationshipsToRemove({
              ...relationshipsToRemove,
              [relationshipName]: [removeUid],
            });
          } else {
            setRelationshipsToRemove({
              [relationshipName]: [removeUid],
            });
          }

          //filters current object
          const o = objects.filter((obj) => obj.uid !== removeUid);
          return { ...relationship, objects: o };
        }

        return relationship;
      });
      console.log("updated - going to", updatedr);

      //hides the relationship from the state array (this is used to ui only)
      updateR(updatedr);
    }
  };

  const [expandedRelationships, setExpandedRelationships] = useState<
    Record<string, boolean>
  >({});
  const { isOver, setNodeRef } = useDroppable({
    id: DROPPABLE_RELATIONSHIPS_ID,
  });

  console.log("nr", newRelationships);
  const nr = parse(newRelationships, relationships);
  console.log("nr parsed", nr);

  if (showDropArea)
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          isOver && "border-primary text-primary",
          "m-4 mt-10 flex h-72 items-center justify-center border-2 border-dotted text-center text-manatee-400",
        )}
      >
        <span>{`Drop object here to add as relationship of ${objectType}  `}</span>
      </div>
    );

  return (
    <div className="relative h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {updatedRelationship &&
          updatedRelationship.map((relationship) => {
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
                />

                <div className="transition duration-300 ease-in-out">
                  <>
                    {nr[relationshipName]?.map((obj, index) => (
                      <>
                        <div className="flex" key={obj.uid}>
                          <ObjectIdentifierCard key={obj.uid} object={obj} />
                          <Pill
                            label={"new"}
                            bgColor={"green"}
                            className="w-20"
                          />

                          <button onClick={() => console.log(obj.uid)}>
                            <Trash
                              className={clsx(
                                "ml-2 flex h-6 w-6 text-manatee-300 transition-all hover:text-error",
                              )}
                            />
                          </button>
                        </div>
                        {index < nr[relationshipName].length - 1 && (
                          <PanelSeparator />
                        )}
                      </>
                    ))}
                    {relationship && displayList?.length > 0 ? (
                      displayList?.map((obj, index) => (
                        <>
                          <ObjectIdentifierCard key={obj.uid} object={obj} />
                          <button
                            disabled={!inEditMode}
                            data-testid={`panel-object-content-item-${
                              index + 1
                            }-remove`}
                            onClick={() => removeItem(obj.uid)}
                          >
                            <Trash
                              className={clsx(
                                "ml-2 flex h-6 w-6 text-manatee-300 transition-all hover:text-error",
                                inEditMode ? "w-6" : "w-0",
                              )}
                            />
                          </button>
                          {index < displayList.length - 1 && <PanelSeparator />}
                        </>
                      ))
                    ) : (
                      <PanelEmptyDataText />
                    )}
                  </>
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
    </div>
  );
};
