import { sentenceCase } from "change-case";
import { Fragment, useState } from "react";
import { FiPlus, FiSearch, FiX } from "react-icons/fi";

import { Button } from "src/components/button";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { ObjectMultiSelect } from "src/components/inputs/multiselect/objectMultiselect/objectMultiselect.component";
import {
  Select,
  SortFieldAndDirectionSelect,
} from "src/components/inputs/select";
import { ObjectIdentifierList } from "src/components/objectIdentifier/list/objectIdentifierList.component";
import { InfoTooltip } from "src/components/tooltip/tooltip.component";
import { useDynamicContentPreview } from "src/hooks/useDynamicContentPreview";
import {
  ObjectTypeWithConfig,
  useAllObjectsMeta,
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkDynamicContentPreviewResponse,
  GQLSkylarkErrorResponse,
  SkylarkObjectMeta,
  SkylarkObjectMetaRelationship,
  SkylarkOrderDirections,
} from "src/interfaces/skylark";
import {
  DynamicSetConfig,
  DynamicSetObjectRule,
  DynamicSetRuleBlock,
} from "src/interfaces/skylark";

const calculateSharedRelationships = (
  selectedObjectMetas?: SkylarkObjectMeta[],
): {
  sharedRelationships: SkylarkObjectMetaRelationship[];
  sharedRelationshipNames: string[];
} => {
  if (!selectedObjectMetas || selectedObjectMetas.length === 0) {
    return {
      sharedRelationships: [],
      sharedRelationshipNames: [],
    };
  }

  if (selectedObjectMetas.length === 1) {
    const sharedRelationships = selectedObjectMetas[0].relationships;
    return {
      sharedRelationships,
      sharedRelationshipNames: sharedRelationships.map(
        ({ relationshipName }) => relationshipName,
      ),
    };
  }

  const allRelationships = selectedObjectMetas?.reduce(
    (prev, { relationships }) => [...prev, ...relationships],
    [] as SkylarkObjectMetaRelationship[],
  );

  return (
    allRelationships.reduce(
      (prev, relationship) => {
        // Already confirmed duplicate
        if (
          prev.sharedRelationshipNames.includes(relationship.relationshipName)
        ) {
          return {
            ...prev,
            sharedRelationships: [...prev.sharedRelationships, relationship],
          };
        }

        const isRelationshipNameDuplicated =
          allRelationships.filter(
            ({ relationshipName }) =>
              relationshipName === relationship.relationshipName,
          ).length > 1;

        return isRelationshipNameDuplicated
          ? {
              sharedRelationshipNames: [
                ...prev.sharedRelationshipNames,
                relationship.relationshipName,
              ],
              sharedRelationships: [...prev.sharedRelationships, relationship],
            }
          : prev;
      },
      {
        sharedRelationshipNames: [] as string[],
        sharedRelationships: [] as SkylarkObjectMetaRelationship[],
      },
    ) || { sharedRelationshipNames: [], sharedRelationships: [] }
  );
};

const validateConfiguration = (configuration: DynamicSetConfig) => {
  if (configuration.objectTypes.length === 0) {
    return false;
  }

  const allRulesValid = configuration.ruleBlocks.every((ruleBlock) => {
    return ruleBlock.objectTypes.length > 0 && ruleBlock.objectRules.length > 0;
  });
  if (!allRulesValid) {
    return false;
  }

  return true;
};

const DisplayError = ({
  configuration,
  error,
}: {
  configuration: DynamicSetConfig;
  error?: GQLSkylarkErrorResponse<GQLSkylarkDynamicContentPreviewResponse> | null;
}) => {
  const ruleErrors = configuration.ruleBlocks
    .map((rule, index) => ({
      name: `Rule block ${index + 1}`,
      missingObjectTypes: rule.objectTypes.length === 0,
      missingRelationshipName: rule.objectRules.some(
        (r) => !r.relationshipName,
      ),
      missingObjects:
        [
          ...(rule.objectRules?.[rule.objectRules.length - 1]?.relatedObjects ||
            []),
          ...(rule.objectRules?.[rule.objectRules.length - 1]?.relatedUid ||
            []),
        ].length === 0,
    }))
    .filter(
      ({ missingObjects, missingRelationshipName, missingObjectTypes }) =>
        missingObjects || missingRelationshipName || missingObjectTypes,
    );

  if (error?.response.errors?.[0].message === "Execution timed out") {
    return <p>Retry</p>;
  }

  return (
    <>
      <p className="mb-4">Content Configuration is invalid.</p>
      {configuration.objectTypes.length === 0 && (
        <p>No object types selected.</p>
      )}
      {ruleErrors.length > 0 &&
        ruleErrors.map(
          ({
            name,
            missingObjectTypes,
            missingRelationshipName,
            missingObjects,
          }) => {
            if (!missingRelationshipName && !missingObjects) {
              return <Fragment key={name} />;
            }

            return (
              <div key={name} className="mb-4">
                <p className="font-medium mb-1">{name}</p>
                <ul>
                  {missingObjectTypes && (
                    <li className="ml-5 list-disc">
                      Missing Object Type selection.
                    </li>
                  )}
                  {missingRelationshipName && (
                    <li className="ml-5 list-disc">
                      Missing a relationship selection.
                    </li>
                  )}
                  {missingObjects && (
                    <li className="ml-5 list-disc">
                      Missing object selection in last filter.
                    </li>
                  )}
                </ul>
              </div>
            );
          },
        )}
      {error && (
        <p>{error.response?.errors?.[0]?.message || error.toString()}</p>
      )}
    </>
  );
};

const ObjectRuleBlock = ({
  objectRule,
  validObjectTypes,
  hideDelete,
  isLastRuleBlock,
  onChange,
  onDelete,
}: {
  isLastRuleBlock: boolean;
  objectRule: DynamicSetObjectRule;
  validObjectTypes: string[];
  hideDelete?: boolean;
  onChange: (r: DynamicSetObjectRule) => void;
  onDelete: () => void;
}) => {
  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const validObjectMetas = allObjectsMeta?.filter(({ name }) =>
    validObjectTypes.includes(name),
  );

  const { sharedRelationships, sharedRelationshipNames } =
    calculateSharedRelationships(validObjectMetas);

  const selectedObjects = objectRule.relatedObjects || [];

  return (
    <div className="relative border border-manatee-200 px-6 rounded py-4 flex">
      <div className="w-full">
        <div className="items-center flex space-x-4 mb-2">
          <p className="whitespace-nowrap font-bold w-24">are related to</p>
          <Select
            options={sharedRelationshipNames.map((relationshipName) => ({
              label: sentenceCase(relationshipName),
              value: relationshipName,
            }))}
            variant="primary"
            labelVariant="form"
            placeholder=""
            onChange={(relationshipName) =>
              onChange({
                ...objectRule,
                relatedObjects: [],
                relatedUid: null,
                relationshipName,
                objectType: sharedRelationships
                  .filter((r) => r.relationshipName === relationshipName)
                  .map(({ objectType }) => objectType)
                  .filter((item, i, arr) => arr.indexOf(item) === i),
              })
            }
            selected={objectRule.relationshipName}
          />
          {objectRule.relatedUid === null && !isLastRuleBlock && (
            <Button
              variant="form-ghost"
              Icon={<FiSearch />}
              disabled={!objectRule.relationshipName}
              onClick={() =>
                onChange({
                  ...objectRule,
                  relatedUid: [],
                })
              }
            >
              Add matches
            </Button>
          )}
        </div>
        {(objectRule.relatedUid !== null ||
          (objectRule.relationshipName && isLastRuleBlock)) && (
          <div className="w-full flex items-center space-x-8">
            <p className="whitespace-nowrap font-bold w-24">that match</p>
            <ObjectMultiSelect
              disabled={!objectRule.relationshipName}
              selectedObjects={selectedObjects}
              onChange={(objects) =>
                onChange({
                  ...objectRule,
                  relatedObjects: objects,
                  relatedUid: objects.map(({ uid }) => uid),
                })
              }
              objectTypes={objectRule.objectType}
              className="w-full flex-grow"
              selectedDivider="OR"
              placeholder={selectedObjects.length > 0 ? "OR" : "Select objects"}
            />
            {!isLastRuleBlock && (
              <Button
                variant="form-ghost"
                Icon={<FiX className="text-lg" />}
                onClick={() =>
                  onChange({
                    ...objectRule,
                    relatedObjects: [],
                    relatedUid: null,
                  })
                }
              />
            )}
          </div>
        )}
      </div>
      {!hideDelete && (
        <button
          onClick={onDelete}
          className="absolute right-2 top-2 p-1 text-manatee-300 hover:text-error transition-colors"
        >
          <FiX className="text-xl" />
        </button>
      )}
    </div>
  );
};

const ContentRuleBlock = ({
  isFirstBlock,
  hideDelete,
  ruleBlock,
  objectTypesWithConfig,
  updateRuleBlock,
  deleteRuleBlock,
}: {
  isFirstBlock: boolean;
  ruleBlock: DynamicSetRuleBlock;
  objectTypesWithConfig: ObjectTypeWithConfig[];
  hideDelete?: boolean;
  updateRuleBlock: (r: DynamicSetRuleBlock) => void;
  deleteRuleBlock: () => void;
}) => {
  const objectTypesToSearchOptions = objectTypesWithConfig.map(
    ({ objectType, config }) => ({
      label: config.objectTypeDisplayName || objectType,
      value: objectType,
    }),
  );

  const onRuleBlockChange = (
    updatedRuleBlock: Partial<DynamicSetRuleBlock>,
  ) => {
    updateRuleBlock({ ...ruleBlock, ...updatedRuleBlock });
  };

  const onObjectRuleChange = (
    objectRule: DynamicSetObjectRule,
    index: number,
  ) => {
    const updatedObjectRules = [...ruleBlock.objectRules];
    updatedObjectRules[index] = objectRule;

    updateRuleBlock({ ...ruleBlock, objectRules: updatedObjectRules });
  };

  const addObjectRule = () => {
    updateRuleBlock({
      ...ruleBlock,
      objectRules: [
        ...ruleBlock.objectRules,
        {
          objectType: [],
          relationshipName: "",
          relatedUid: null,
          relatedObjects: [],
        },
      ],
    });
  };

  const deleteObjectRule = (index: number) => {
    updateRuleBlock({
      ...ruleBlock,
      objectRules: ruleBlock.objectRules.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="mb-4 px-6 py-8 border-manatee-200 w-full relative border rounded shadow-sm">
      <div className="flex space-x-4 justify-center items-center w-full mb-4">
        <p className="whitespace-nowrap font-bold">
          {isFirstBlock ? "Where" : "And"}
        </p>
        <MultiSelect
          renderInPortal
          options={objectTypesToSearchOptions}
          selected={ruleBlock.objectTypes}
          onChange={(objectTypes) =>
            onRuleBlockChange({
              objectTypes: objectTypes.filter(
                (item, i, arr) => arr.indexOf(item) === i,
              ),
            })
          }
          placeholder={
            ruleBlock.objectTypes.length === 0
              ? "Select object types for this rule"
              : "OR"
          }
          className="w-full"
          selectedDivider={<p>OR</p>}
        />
      </div>

      <div className=" ml-0 border-l- border-manatee-300 flex flex-col justify-center relative w-full">
        {ruleBlock.objectRules.map((objectRule, i, arr) => (
          <div key={i} className="w-full relative my-2">
            <ObjectRuleBlock
              key={i}
              isLastRuleBlock={i === arr.length - 1}
              objectRule={objectRule}
              validObjectTypes={
                arr?.[i - 1]?.objectType || ruleBlock.objectTypes
              }
              onChange={(ruleBlock) => onObjectRuleChange(ruleBlock, i)}
              onDelete={() => deleteObjectRule(i)}
              hideDelete={i === 0 || i < arr.length - 1}
            />
          </div>
        ))}
        <div>
          <Button
            disabled={ruleBlock.objectRules.length === 5}
            variant="link"
            onClick={addObjectRule}
            Icon={<FiPlus className="text-xl" />}
          >
            Add relationship step
          </Button>
        </div>
      </div>
      {!hideDelete && (
        <div className="top-0 right-3 absolute flex items-center">
          <Button
            variant="ghost"
            className="text-manatee-300 hover:text-error"
            onClick={deleteRuleBlock}
          >
            <FiX className="text-xl" />
          </Button>
        </div>
      )}
    </div>
  );
};

export const DynamicContentConfigurationEditor = ({
  initialConfiguration,
  onConfigurationChange,
}: {
  initialConfiguration: DynamicSetConfig | null;
  onConfigurationChange: (c: DynamicSetConfig) => void;
}) => {
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig({
    withAvailabilityObjectTypes: false,
  });

  const [configuration, setConfigurationState] = useState<DynamicSetConfig>(
    initialConfiguration || {
      objectTypes: [],
      ruleBlocks: [],
      contentSortDirection: null,
      contentSortField: null,
      contentLimit: null,
    },
  );

  const setConfiguration = (newState: Partial<DynamicSetConfig>) =>
    setConfigurationState((previousState) => {
      const updatedState = {
        ...previousState,
        ...newState,
      };

      onConfigurationChange(updatedState);

      return updatedState;
    });

  const updateRuleBlocks = (ruleBlocks: DynamicSetConfig["ruleBlocks"]) => {
    const objectTypes = [
      ...new Set(
        ruleBlocks.reduce(
          (prev, { objectTypes }) => [...prev, ...objectTypes],
          [] as string[],
        ),
      ),
    ];

    const updatedConfiguration = {
      ...configuration,
      objectTypes,
      ruleBlocks,
    };

    setConfiguration(updatedConfiguration);
  };

  // const canAddNewRule =
  //   ruleBlocks.length === 0 ||
  //   (ruleBlocks[-1]?.objectTypesToSearch.length > 0 &&
  //     ruleBlocks[-1]?.objectRules.length > 0);

  const addRuleBlock = () => {
    // if (!canAddNewRule) {
    //   return;
    // }
    const newRuleBlock: DynamicSetRuleBlock = {
      objectTypes: configuration.objectTypes,
      objectRules: [{ relationshipName: "", objectType: [] }],
    };
    updateRuleBlocks([...configuration.ruleBlocks, newRuleBlock]);
  };

  const deleteRuleBlock = (index: number) => {
    updateRuleBlocks(configuration.ruleBlocks.filter((_, i) => i !== index));
  };

  const updateRuleBlock = (
    index: number,
    newRuleBlock: DynamicSetRuleBlock,
  ) => {
    updateRuleBlocks(
      configuration.ruleBlocks.map((oldRuleBlock, i) =>
        i === index ? newRuleBlock : oldRuleBlock,
      ),
    );
  };

  const handleConfigurationObjectTypeChange = (
    updatedObjectTypes: string[],
  ) => {
    setConfiguration({
      objectTypes: updatedObjectTypes,
    });
  };

  const { objectOperations } = useSkylarkObjectOperations("SkylarkSet");

  const isValidConfiguration = validateConfiguration(configuration);

  const { data, isLoading, error } = useDynamicContentPreview(configuration, {
    disabled: !isValidConfiguration,
    language: null,
  });

  return (
    <div className="flex w-full gap-4 overflow-hidden grow">
      <div className="text-sm w-full md:w-3/5 2xl:w-2/3 flex flex-col">
        <p className="text-xl font-bold text-left mb-4">
          Configure Dynamic Content
        </p>
        {objectOperations && objectTypesWithConfig && (
          <div className="overflow-scroll pr-4 pb-20">
            <div className="p-6 shadow-sm rounded-sm border border-manatee-200 mb-4">
              <MultiSelect
                label="Object Types to include in Content"
                labelVariant="form"
                options={objectTypesWithConfig.map(
                  ({ objectType, config }) => ({
                    label: config.objectTypeDisplayName || objectType,
                    value: objectType,
                  }),
                )}
                selected={configuration.objectTypes}
                selectedDivider="AND"
                renderInPortal
                onChange={handleConfigurationObjectTypeChange}
              />
              <SortFieldAndDirectionSelect
                label="Sort field"
                labelVariant="form"
                containerClassName="mt-4"
                variant="primary"
                objectTypes={configuration.objectTypes}
                values={{
                  sortField: configuration.contentSortField || "__manual",
                  sortDirection:
                    configuration.contentSortDirection ||
                    SkylarkOrderDirections.ASC,
                }}
                onChange={(values) =>
                  setConfiguration({
                    contentSortField: values.sortField,
                    contentSortDirection: values.sortDirection,
                  })
                }
              />
              <Select
                selected={configuration.contentLimit || undefined}
                options={Array.from({ length: 50 }, (_, i) => ({
                  value: i + 1,
                  label: `${i + 1}`,
                }))}
                label="Limit"
                labelVariant="form"
                className="mt-4"
                placeholder="Default"
                variant="primary"
                onChange={(contentLimit) =>
                  setConfiguration({
                    contentLimit: contentLimit || null,
                  })
                }
                onValueClear={() =>
                  setConfiguration({
                    contentLimit: null,
                  })
                }
                renderInPortal
              />
            </div>
            {configuration.ruleBlocks.map((ruleBlock, i) => (
              <ContentRuleBlock
                key={i}
                isFirstBlock={i === 0}
                ruleBlock={ruleBlock}
                objectTypesWithConfig={objectTypesWithConfig}
                updateRuleBlock={(newRuleBlock) =>
                  updateRuleBlock(i, newRuleBlock)
                }
                deleteRuleBlock={() => deleteRuleBlock(i)}
                hideDelete={configuration.ruleBlocks.length === 1}
              />
            ))}

            <Button
              variant="link"
              onClick={addRuleBlock}
              className=""
              Icon={<FiPlus className="text-xl" />}
              // disabled={!canAddNewRule}
            >
              Add rule
            </Button>
          </div>
        )}
      </div>
      <div className="hidden md:flex md:w-2/5 2xl:w-1/3 flex-col">
        {/* <p className="text-xl font-bold text-left mb-4">Preview</p> */}
        <div className="flex items-center mb-4">
          <p className="text-xl font-bold text-left">Preview</p>
          <InfoTooltip
            tooltip={
              <div className="flex flex-col">
                <p>{`Displaying a random ${data?.count} objects.`}</p>
                <p>
                  The actual content and ordering may change when using a full
                  data set.
                </p>
              </div>
            }
          />
        </div>
        {data && (
          <div className="flex flex-col overflow-hidden flex-grow">
            <p className="mb-4 text-sm">
              {`${data.totalCount} objects match the rules specified${configuration.contentLimit ? `, limited to ${configuration.contentLimit}` : ""}.`}
            </p>
            <div className="overflow-scroll flex-grow border border-manatee-200 rounded w-full">
              <ObjectIdentifierList
                objects={data.objects}
                className="px-4"
                hideAvailabilityStatus
              />
            </div>
          </div>
        )}
        {!data && isValidConfiguration && isLoading && (
          <p>Loading preview...</p>
        )}
        {(error || !isValidConfiguration) && (
          <DisplayError error={error} configuration={configuration} />
        )}
      </div>
    </div>
  );
};
