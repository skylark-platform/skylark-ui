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
  SkylarkObjectMeta,
  SkylarkObjectMetaRelationship,
} from "src/interfaces/skylark";
import {
  DynamicSetConfig,
  DynamicSetObjectRule,
  DynamicSetRuleBlock,
} from "src/interfaces/skylark";
import { createUpdateObjectDynamicContentConfigurationMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";

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
        <div className="items-center flex space-x-8">
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
            className="mb-2"
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
              selectedObjects={objectRule.relatedObjects || []}
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
  setRuleBlock,
  deleteRuleBlock,
}: {
  // validObjectTypes: string[];
  isFirstBlock: boolean;
  ruleBlock: DynamicSetRuleBlock;
  objectTypesWithConfig: ObjectTypeWithConfig[];
  hideDelete?: boolean;
  // setRuleBlock: Dispatch<SetStateAction<RuleBlock>>;
  setRuleBlock: (r: DynamicSetRuleBlock) => void;
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
    setRuleBlock({ ...ruleBlock, ...updatedRuleBlock });
  };

  const onObjectRuleChange = (
    objectRule: DynamicSetObjectRule,
    index: number,
  ) => {
    // setRuleBlock((prev) => ({ ...prev, ...updatedRuleBlock }));
    const updatedObjectRules = [...ruleBlock.objectRules];
    updatedObjectRules[index] = objectRule;

    console.log({ objectRule });
    setRuleBlock({ ...ruleBlock, objectRules: updatedObjectRules });
  };

  const addObjectRule = () => {
    setRuleBlock({
      ...ruleBlock,
      objectRules: [
        ...ruleBlock.objectRules,
        { objectType: [], relationshipName: "" },
      ],
    });
  };

  const deleteObjectRule = (index: number) => {
    setRuleBlock({
      ...ruleBlock,
      objectRules: ruleBlock.objectRules.filter((_, i) => i !== index),
    });
  };

  console.log(ruleBlock.objectRules);

  return (
    <div className="my-4 px-8 py-8 border-manatee-200 w-full relative border rounded">
      {/* <h3 className="text-2xl font-medium mb-2">Condition</h3> */}
      <div className="flex space-x-4 justify-center items-center w-full">
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
          className="w-full mb-4"
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

export default function DynamicSets() {
  const [setUid, setSetUid] = useState("");

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig({
    withAvailabilityObjectType: false,
  });

  // const [objectTypes, setObjectTypes] = useState<
  //   DynamicSetConfig["objectTypes"]
  // >([]);

  const [ruleBlocks, setRuleBlocks] = useState<DynamicSetConfig["ruleBlocks"]>(
    [],
  );

  const canAddNewRule =
    ruleBlocks.length === 0 ||
    (ruleBlocks[-1]?.objectTypesToSearch.length > 0 &&
      ruleBlocks[-1]?.objectRules.length > 0);

  const addContentRule = () => {
    // if (!canAddNewRule) {
    //   return;
    // }
    const newRule: DynamicSetRuleBlock = {
      objectTypesToSearch: [],
      objectRules: [{ relationshipName: "", objectType: [] }],
    };
    setRuleBlocks((prev) => [...prev, newRule]);
  };

  const { objectOperations } = useSkylarkObjectOperations("SkylarkSet");

  const objectTypes = [
    ...new Set(
      ruleBlocks.reduce(
        (prev, { objectTypesToSearch }) => [...prev, ...objectTypesToSearch],
        [] as string[],
      ),
    ),
  ];

  const { data, query } = useDynamicContentPreview({ objectTypes, ruleBlocks });

  console.log("preview", { data });

  return (
    <div className="w-full grid grid-cols-3 pt-32 mx-auto">
      <div className="mx-auto flex max-w-3xl w-full flex-col justify-start items-center text-sm col-span-2">
        {objectOperations && objectTypesWithConfig && (
          <>
            {/* <MultiSelect
              label="Populate a Set with content matching the types"
              labelVariant="form"
              options={objectTypesWithConfig.map(({ objectType, config }) => ({
                label: config.objectTypeDisplayName || objectType,
                value: objectType,
              }))}
              selected={objectTypes}
              onChange={setObjectTypes}
              className="w-full"
            /> */}
            {ruleBlocks.map((ruleBlock, i) => (
              <Fragment key={i}>
                <ContentRuleBlock
                  key={i}
                  isFirstBlock={i === 0}
                  ruleBlock={ruleBlock}
                  // validObjectTypes={objectTypes}
                  objectTypesWithConfig={objectTypesWithConfig}
                  setRuleBlock={(newRule) =>
                    setRuleBlocks((oldRules) =>
                      oldRules.map((oldRule, j) =>
                        j === i ? newRule : oldRule,
                      ),
                    )
                  }
                  deleteRuleBlock={() =>
                    setRuleBlocks((oldRules) =>
                      oldRules.filter((oldRule, j) => j !== i),
                    )
                  }
                  hideDelete={ruleBlocks.length === 1}
                />
                {/* <p className="whitespace-nowrap text-lef w-ful">AND</p> */}
              </Fragment>
            ))}
            <Button
              variant="primary"
              onClick={addContentRule}
              className="mt-4"
              // disabled={!canAddNewRule}
            >
              Add new Content Rule
            </Button>
          </>
        )}
      </div>
      <div className="w-full col-span-1">
        {data ? (
          <>
            <p>Preview</p>
            <p>Total matching: {data.totalCount}</p>
            <p>Total in preview: {data.count}</p>
            <div className="h-96 overflow-scroll mx-4 px-4 my-4 border border-manatee-300">
              <ObjectIdentifierList objects={data.objects} />
            </div>
            <TextInput
              onChange={setSetUid}
              value={setUid}
              label="UID of Set to update"
              className="mb-4 mr-4"
            />
            <Button variant={"primary"}>Update</Button>
          </>
        ) : (
          <>
            <p>DynamicSetInput:</p>
            <pre className="text-xs mt-2">
              {objectOperations &&
                // objectTypes &&
                ruleBlocks &&
                query &&
                print(
                  // createUpdateObjectDynamicContentConfigurationMutation(
                  //   objectOperations,
                  //   { objectTypes, ruleBlocks },
                  // ) as DocumentNode,
                  query,
                )}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
