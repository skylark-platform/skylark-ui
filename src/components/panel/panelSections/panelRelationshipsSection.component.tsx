import clsx from "clsx";
import { Transition, m } from "framer-motion";
import { Fragment, Ref, forwardRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { sentenceCase } from "sentence-case";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  PanelButton,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Tooltip } from "src/components/tooltip/tooltip.component";
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
  isFetchingMoreRelationships: boolean;
  newUids: string[];
  isExpanded: boolean;
  config: ParsedSkylarkObjectTypeRelationshipConfiguration["config"] | null;
  setExpandedRelationship: (r: string | null) => void;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  removeRelationshipObject: (args: {
    uid: string;
    relationshipName: string;
  }) => void;
  setSearchObjectsModalState: (args: {
    relationship: ParsedSkylarkObjectRelationship;
    fields?: string[];
  }) => void;
  hasMoreRelationships?: boolean;
  fetchMoreRelationships: () => void;
}

const transition: Transition = {
  duration: 0.15,
  ease: "linear",
};

const PanelRelationshipSectionComponent = (
  {
    isEmptySection,
    relationship,
    inEditMode,
    isFetchingMoreRelationships,
    newUids,
    // variant,
    isExpanded,
    config,
    hasMoreRelationships,
    setPanelObject,
    removeRelationshipObject,
    setSearchObjectsModalState,
    setExpandedRelationship,
    fetchMoreRelationships,
  }: PanelRelationshipsSectionProps,
  ref: Ref<HTMLDivElement>,
) => {
  const { name: relationshipName, objects, objectType } = relationship;

  const { ref: inViewRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasMoreRelationships) {
      fetchMoreRelationships();
    }
  });

  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const objectFields = objectOperations?.fields.map(({ name }) => name);

  const hasShowMore = objects?.length > 4;

  const displayList =
    hasShowMore && !isExpanded ? objects.slice(0, 5) : objects;

  const toggleExpanded = () => {
    setExpandedRelationship(isExpanded ? null : relationshipName);
  };

  const canLoadMore = isExpanded && hasMoreRelationships;

  return (
    <m.div
      ref={ref}
      key={`${relationshipName}-container`}
      className={clsx("pb-6 bg-white")}
      data-testid={relationshipName}
      transition={transition}
      initial={{ opacity: 0, height: "auto" }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: "auto" }}
    >
      <m.div
        key={`${relationshipName}-title`}
        layout
        transition={transition}
        className={clsx(
          "flex items-center justify-between bg-white pt-8 -mt-8",
          isExpanded && "sticky top-0 z-10",
          !isExpanded && "relative z-10",
        )}
      >
        <div className="flex items-center -ml-7">
          {toggleExpanded && (
            <PanelButton
              aria-label={`${
                isExpanded ? "close" : "expand"
              } ${relationshipName} relationship`}
              className="mx-0.5"
              type={isExpanded ? "x" : "maximise"}
              onClick={toggleExpanded}
            />
          )}
          <PanelSectionTitle
            text={formatObjectField(relationshipName)}
            count={
              hasMoreRelationships ? `${objects.length}+` : objects.length || 0
            }
            id={`panel-section-${relationshipName}`}
            loading={isFetchingMoreRelationships}
          />
          {!isFetchingMoreRelationships && (
            <PanelButton
              className="ml-1"
              type="plus"
              onClick={() =>
                setSearchObjectsModalState({
                  relationship,
                  fields: objectFields,
                })
              }
            />
          )}
        </div>
        {!isEmptySection && config?.defaultSortField && (
          <p className="text-manatee-300 text-xs mb-4 hover:text-manatee-600 transition-colors cursor-default">{`Sorted by: ${sentenceCase(
            config.defaultSortField,
          )}`}</p>
        )}
      </m.div>

      <m.div
        key={`${relationshipName}-objects`}
        transition={transition}
        layout="position"
      >
        <div className="overflow-hidden">
          {displayList?.length > 0 &&
            displayList?.map((obj, index) => {
              const defaultSortFieldValue =
                config?.defaultSortField &&
                hasProperty(obj.metadata, config.defaultSortField) &&
                obj.metadata[config.defaultSortField];

              return (
                <m.div
                  key={`relationship-${obj.objectType}-${obj.uid}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.05,
                    ease: "linear",
                  }}
                >
                  <div
                    className="flex items-center bg-white"
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
                </m.div>
              );
            })}
        </div>
      </m.div>

      <m.div layout className="mb-3" transition={{ duration: 0.08 }}>
        {hasShowMore && toggleExpanded && (
          <>
            <PanelSeparator />
            <button
              ref={canLoadMore ? inViewRef : null}
              data-testid={`expand-relationship-${relationshipName}`}
              onClick={canLoadMore ? fetchMoreRelationships : toggleExpanded}
              className="w-full cursor-pointer p-2 text-center text-xs text-manatee-500 hover:text-manatee-700"
            >
              {canLoadMore
                ? "Load more"
                : `Show ${isExpanded ? "less" : "more"}`}
              {/* {isExpanded ? "Collapse" : "Expand"} */}
            </button>
          </>
        )}
      </m.div>
    </m.div>
  );
};

export const PanelRelationshipSection = forwardRef(
  PanelRelationshipSectionComponent,
);
