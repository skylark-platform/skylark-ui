import clsx from "clsx";
import { Transition, motion } from "motion/react";
import { Ref, forwardRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { SortFieldAndDirectionSelect } from "src/components/inputs/select";
import { ObjectIdentifierCard } from "src/components/objectIdentifier";
import {
  PanelButton,
  PanelSectionTitle,
  PanelSeparator,
} from "src/components/panel/panelTypography";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { SetPanelObject } from "src/hooks/state";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectRelationship,
  ParsedSkylarkRelationshipConfig,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface PanelRelationshipsSectionProps {
  isEmptySection?: boolean;
  relationship: SkylarkObjectRelationship;
  inEditMode: boolean;
  isFetchingMoreRelationships: boolean;
  newUids: string[];
  isExpanded: boolean;
  objectTypeDefaultConfig: ParsedSkylarkRelationshipConfig | null;
  modifiedConfig?: Partial<ParsedSkylarkRelationshipConfig>;
  setExpandedRelationship: (r: string | null) => void;
  setPanelObject: SetPanelObject;
  removeRelationshipObject: (args: {
    uid: string;
    relationshipName: string;
  }) => void;
  updateRelationshipConfig: (
    updatedConfig: Partial<ParsedSkylarkRelationshipConfig>,
  ) => void;
  setSearchObjectsModalState: (args: {
    relationship: SkylarkObjectRelationship;
    fields?: string[];
  }) => void;
  hasMoreRelationships?: boolean;
  fetchMoreRelationships?: () => void;
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
    isExpanded,
    objectTypeDefaultConfig,
    hasMoreRelationships,
    modifiedConfig,
    setPanelObject,
    removeRelationshipObject,
    updateRelationshipConfig,
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
      fetchMoreRelationships?.();
    }
  });

  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const objectFields = objectOperations?.fields.map(({ name }) => name);

  const hasShowMore = objects?.length > 4;

  const toggleExpanded = () => {
    setExpandedRelationship(isExpanded ? null : relationshipName);
  };

  const canLoadMore = isExpanded && hasMoreRelationships;

  const displayList =
    hasShowMore && !isExpanded ? objects.slice(0, 5) : objects;

  const activeSortField =
    modifiedConfig?.defaultSortField ||
    relationship.config.defaultSortField ||
    objectTypeDefaultConfig?.defaultSortField;

  return (
    <motion.div
      ref={ref}
      key={`${relationshipName}-container`}
      className={clsx("pb-6 bg-white")}
      data-testid={relationshipName}
      transition={transition}
      initial={{ opacity: 0, height: "auto" }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: "auto" }}
    >
      <motion.div
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
              aria-label={`Open edit ${relationshipName} relationship modal`}
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
        {!isEmptySection && (
          <SortFieldAndDirectionSelect
            hideDirectionSelect
            objectTypes={[objectType]}
            variant="pill"
            containerClassName="mb-2 pb-1 md:pb-2 flex-grow justify-end"
            values={{
              sortField:
                activeSortField ||
                objectTypeDefaultConfig?.defaultSortField ||
                "",
            }}
            manualSortLabel={`Reset to default (${objectTypeDefaultConfig?.defaultSortField || "Unsorted"})`}
            onChange={({ sortField }) =>
              updateRelationshipConfig({ defaultSortField: sortField })
            }
          />
        )}
      </motion.div>

      <motion.div
        key={`${relationshipName}-objects`}
        transition={transition}
        layout="position"
      >
        <div className="overflow-hidden">
          {displayList?.length > 0 &&
            displayList?.map((obj, index) => {
              const sortFieldValue = activeSortField
                ? obj.additionalFields?.[activeSortField]
                : "";

              return (
                <motion.div
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
                      {sortFieldValue && (
                        <Tooltip tooltip={sortFieldValue}>
                          <p
                            className="flex max-w-8 sm:max-w-full min-w-3 overflow-hidden whitespace-nowrap text-sm text-manatee-500 cursor-default"
                            data-testid="object-sort-field"
                          >
                            <span className="overflow-hidden text-ellipsis">
                              {sortFieldValue}
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
                </motion.div>
              );
            })}
        </div>
      </motion.div>

      <motion.div layout className="mb-3" transition={{ duration: 0.08 }}>
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
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export const PanelRelationshipSection = forwardRef(
  PanelRelationshipSectionComponent,
);
