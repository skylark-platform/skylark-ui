import { sentenceCase } from "change-case";
import clsx from "clsx";
import { DocumentNode, print, getOperationAST } from "graphql";
import { useRouter } from "next/router";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowDown, FiPlus, FiTrash, FiTrash2, FiX } from "react-icons/fi";

import { Button } from "src/components/button";
import { TextInput } from "src/components/inputs/input";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { ObjectMultiSelect } from "src/components/inputs/multiselect/objectMultiselect/objectMultiselect.component";
import { Select } from "src/components/inputs/select";
import { SearchObjectsModal } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifier";
import { ObjectIdentifierList } from "src/components/objectIdentifier/list/objectIdentifierList.component";
import { Skeleton } from "src/components/skeleton";
import { useGetObjectContent } from "src/hooks/objects/get/useGetObjectContent";
import { useDynamicContentPreview } from "src/hooks/useDynamicContentPreview";
import {
  ObjectTypeWithConfig,
  useAllObjectsMeta,
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  SkylarkObject,
  SkylarkObjectMeta,
  SkylarkObjectMetaRelationship,
} from "src/interfaces/skylark";
import {
  DynamicSetConfig,
  DynamicSetObjectRule,
  DynamicSetRuleBlock,
} from "src/interfaces/skylark";
import { createUpdateObjectDynamicContentConfigurationMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";
import {
  convertParsedObjectToIdentifier,
  createDefaultSkylarkObject,
} from "src/lib/skylark/objects";

// interface ContentRule {
//   // This is an OR
//   blocks: RuleBlock[];
// }

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

const mergeRelatedObjectsAndUids = (
  objectTypes: string[],
  relatedObjects?: SkylarkObject[],
  relatedUids?: string[],
) => {
  if (!relatedUids) {
    return relatedObjects || [];
  }

  const objectType = objectTypes?.[0] || "";

  const remainingRelatedUids = relatedObjects
    ? relatedUids.filter((uid) => !relatedObjects.find((o) => o.uid === uid))
    : relatedUids;

  const uidsAsSkylarkObjects = remainingRelatedUids.map((uid) =>
    createDefaultSkylarkObject({ uid, objectType }),
  );
  return [...uidsAsSkylarkObjects, ...(relatedObjects || [])];
};

const ObjectRuleBlock = ({
  isFirstRuleBlock,
  objectRule,
  validObjectTypes,
  hideDelete,
  onChange,
  onDelete,
}: {
  isFirstRuleBlock: boolean;
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

  // const allRelationshipNames =
  // const commonRelationships = relationships?.filter(
  //   ({ relationshipName }) => relationships,
  // );

  const { sharedRelationships, sharedRelationshipNames } =
    calculateSharedRelationships(validObjectMetas);

  console.log({ sharedRelationships });

  return (
    <div className="relative border border-manatee-200 px-8 rounded py-4 flex">
      <div className="w-full">
        <div className="items-center flex space-x-8 mb-2">
          {/* <p className="whitespace-nowrap font-bold w-8 text-center ml-2 rounded">
          {isFirstRuleBlock ? "" : "that"}
        </p> */}
          {/* <Select
          // label="At least one object linked in the relationship"
          options={[
            {
              label: isFirstRuleBlock ? "have related" : `have related`,
              value: "relationship",
            },
            {
              label: "contain one of",
              value: "uid",
            },
          ]}
          variant="primary"
          labelVariant="form"
          placeholder=""
          className={clsx("my-2 ", isFirstRuleBlock && "ml-12")}
          selected={"relationship"}
          disabled
        /> */}
          <p className="whitespace-nowrap font-bold">are related to</p>
          <Select
            // label="At least one object linked in the relationship"
            options={sharedRelationshipNames.map((relationshipName) => ({
              label: sentenceCase(relationshipName),
              value: relationshipName,
            }))}
            variant="primary"
            labelVariant="form"
            placeholder=""
            // className="mb-2"
            onChange={(relationshipName) =>
              onChange({
                ...objectRule,
                relatedObjects: [],
                relationshipName,
                objectType: sharedRelationships
                  .filter((r) => r.relationshipName === relationshipName)
                  .map(({ objectType }) => objectType)
                  .filter((item, i, arr) => arr.indexOf(item) === i),
              })
            }
            selected={objectRule.relationshipName}
          />
        </div>
        {objectRule.relationshipName && (
          <div className="pl-8 w-full flex items-center space-x-8">
            <p className="whitespace-nowrap font-bold">that contain</p>
            <ObjectMultiSelect
              selectedObjects={mergeRelatedObjectsAndUids(
                objectRule.objectType,
                objectRule.relatedObjects,
                objectRule.relatedUid,
              )}
              onChange={(objects) =>
                onChange({
                  ...objectRule,
                  relatedObjects: objects,
                })
              }
              objectTypes={objectRule.objectType}
              className="w-full flex-grow"
              selectedDivider="OR"
            />
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
  // validObjectTypes,
  isFirstBlock,
  hideDelete,
  ruleBlock,
  objectTypesWithConfig,
  updateRuleBlock,
  deleteRuleBlock,
}: {
  // validObjectTypes: string[];
  isFirstBlock: boolean;
  ruleBlock: DynamicSetRuleBlock;
  objectTypesWithConfig: ObjectTypeWithConfig[];
  hideDelete?: boolean;
  // setRuleBlock: Dispatch<SetStateAction<RuleBlock>>;
  updateRuleBlock: (r: DynamicSetRuleBlock) => void;
  deleteRuleBlock: () => void;
}) => {
  const objectTypesToSearchOptions = objectTypesWithConfig
    // .filter(({ objectType }) => validObjectTypes.includes(objectType))
    .map(({ objectType, config }) => ({
      label: config.objectTypeDisplayName || objectType,
      value: objectType,
    }));

  const onRuleBlockChange = (
    updatedRuleBlock: Partial<DynamicSetRuleBlock>,
  ) => {
    // setRuleBlock((prev) => ({ ...prev, ...updatedRuleBlock }));
    updateRuleBlock({ ...ruleBlock, ...updatedRuleBlock });
  };

  const onObjectRuleChange = (
    objectRule: DynamicSetObjectRule,
    index: number,
  ) => {
    // setRuleBlock((prev) => ({ ...prev, ...updatedRuleBlock }));
    const updatedObjectRules = [...ruleBlock.objectRules];
    updatedObjectRules[index] = objectRule;

    console.log({ objectRule });
    updateRuleBlock({ ...ruleBlock, objectRules: updatedObjectRules });
  };

  const addObjectRule = () => {
    updateRuleBlock({
      ...ruleBlock,
      objectRules: [
        ...ruleBlock.objectRules,
        { objectType: [], relationshipName: "" },
      ],
    });
  };

  const deleteObjectRule = (index: number) => {
    updateRuleBlock({
      ...ruleBlock,
      objectRules: ruleBlock.objectRules.filter((_, i) => i !== index),
    });
  };

  console.log(ruleBlock.objectRules);

  return (
    <div className="mb-4 px-8 py-8 border-manatee-200 w-full relative border rounded shadow-sm">
      {/* <h3 className="text-2xl font-medium mb-2">Condition</h3> */}
      <div className="flex space-x-4 justify-center items-center w-full mb-4">
        <p className="whitespace-nowrap font-bold">
          {isFirstBlock ? "Where" : "And"}
        </p>
        <MultiSelect
          // label="Given objects matching the types:"
          // labelVariant="form"
          options={objectTypesToSearchOptions}
          selected={ruleBlock.objectTypesToSearch}
          onChange={(objectTypesToSearch) =>
            onRuleBlockChange({
              objectTypesToSearch: objectTypesToSearch.filter(
                (item, i, arr) => arr.indexOf(item) === i,
              ),
            })
          }
          placeholder={
            ruleBlock.objectTypesToSearch.length === 0
              ? "Select object types for this rule"
              : ""
          }
          className="w-full"
          selectedDivider={<p>OR</p>}
        />
        {/* <p className="whitespace-nowrap">object types</p> */}
      </div>

      <div className=" ml-0 border-l- border-manatee-300 flex flex-col justify-center relative w-full">
        {ruleBlock.objectRules.map((objectRule, i, arr) => (
          <div key={i} className="w-full relative my-2">
            {/* {i < arr.length && (
              <p className="my-4 font-medium">
                {i === 0 ? "That have" : "AND where objects returned have"}
              </p>
            )} */}
            <ObjectRuleBlock
              key={i}
              isFirstRuleBlock={i === 0}
              objectRule={objectRule}
              validObjectTypes={
                arr?.[i - 1]?.objectType || ruleBlock.objectTypesToSearch
              }
              onChange={(ruleBlock) => onObjectRuleChange(ruleBlock, i)}
              onDelete={() => deleteObjectRule(i)}
              hideDelete={i === 0 || i < arr.length - 1}
            />
            {/* {arr.length > 1 && i === arr.length - 1 && (
              <div className="bottom-0 top-0 -right-4 absolute flex items-center">
                <Button
                  variant="ghost"
                  className="text-error"
                  onClick={() => deleteObjectRule(i)}
                >
                  <FiTrash2 className="text-xl" />
                </Button>
              </div>
            )} */}
          </div>
        ))}
        <div>
          <Button
            disabled={ruleBlock.objectRules.length === 5}
            variant="link"
            onClick={addObjectRule}
            Icon={<FiPlus className="text-xl" />}
          >
            Add filter
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
    withAvailabilityObjectType: false,
  });

  const [configuration, setConfiguration] = useState<DynamicSetConfig>(
    initialConfiguration || { objectTypes: [], ruleBlocks: [] },
  );

  const updateRuleBlocks = (ruleBlocks: DynamicSetConfig["ruleBlocks"]) => {
    const objectTypes = [
      ...new Set(
        ruleBlocks.reduce(
          (prev, { objectTypesToSearch }) => [...prev, ...objectTypesToSearch],
          [] as string[],
        ),
      ),
    ];

    const updatedConfiguration = {
      objectTypes,
      ruleBlocks,
    };

    setConfiguration(updatedConfiguration);

    onConfigurationChange(updatedConfiguration);
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
      objectTypesToSearch: [],
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

  const { objectOperations } = useSkylarkObjectOperations("SkylarkSet");

  const { data, query, isLoading, error } =
    useDynamicContentPreview(configuration);

  console.log("preview", { data });

  return (
    <div className="flex w-full gap-8 overflow-hidden">
      <div className="text-sm w-3/5 xl:w-3/4 2xl:w-2/3 flex flex-col">
        <p className="text-xl font-bold text-left mb-4">Builder</p>
        {objectOperations && objectTypesWithConfig && (
          <div className="overflow-scroll px-4 pb-20">
            {configuration.ruleBlocks.map((ruleBlock, i) => (
              <Fragment key={i}>
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
                {/* <p className="whitespace-nowrap text-lef w-ful">AND</p> */}
              </Fragment>
            ))}
            <Button
              variant="link"
              onClick={addRuleBlock}
              className=""
              Icon={<FiPlus className="text-xl" />}
              // disabled={!canAddNewRule}
            >
              Add condition
            </Button>
          </div>
        )}
      </div>
      <div className="w-2/5 xl:w-1/4 2xl:w-1/3 flex flex-col">
        <p className="text-xl font-bold text-left mb-4">Preview</p>
        {data && (
          <div className="flex flex-col overflow-hidden flex-grow">
            <p>Overview:</p>
            <p>Total matching: {data.totalCount}</p>
            <p>Total in preview: {data.count}</p>
            <p className="font-bold text-sm">Sample objects</p>
            <p>{`Displaying a random ${data.count} objects out of a possible ${data.totalCount}.`}</p>
            {/* <div className="flex flex-grow"> */}
            <div className="overflow-scroll border border-manatee-200 rounded w-full">
              <ObjectIdentifierList objects={data.objects} className="px-4" />
            </div>
            {/* </div> */}
          </div>
        )}
        {!data && (
          <p>
            {isLoading
              ? `Loading preview...`
              : `Content Configuration is invalid.`}
          </p>
        )}
        {error && <p>{error.toString()}</p>}
      </div>
    </div>
  );
};
