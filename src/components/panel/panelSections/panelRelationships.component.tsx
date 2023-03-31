import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useState } from "react";
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
  SkylarkObjectRelationship,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface PanelRelationshipsProps {
  objectType: SkylarkObjectType;
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
    console.log("sdas", key);

    if (key) {
      const current = acc[key] || [];
      return { ...acc, [key]: [...current, cv] };
    } else {
      toast(
        <Toast
          title={`Error`}
          message={`Can't add ${cv.objectType} to this object relationship`}
          type="error"
        />,
      );
    }
    return acc;
  }, {});
};

export const PanelRelationships = ({
  objectType,
  uid,
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
    <div className="overflow-anywhere relative h-full overflow-y-auto p-4 pb-12 text-sm md:p-8 md:pb-20">
      <div>
        {relationshipsData &&
          relationshipsData.map((relationship) => {
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
