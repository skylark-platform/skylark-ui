import { DocumentNode, print, getOperationAST } from "graphql";
import { useRouter } from "next/router";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowDown, FiTrash, FiTrash2 } from "react-icons/fi";

import { Button } from "src/components/button";
import { TextInput } from "src/components/inputs/input";
import { MultiSelect } from "src/components/inputs/multiselect/multiselect.component";
import { Select } from "src/components/inputs/select";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { Skeleton } from "src/components/skeleton";
import { useGetObjectContent } from "src/hooks/objects/get/useGetObjectContent";
import {
  ObjectTypeWithConfig,
  useAllObjectsMeta,
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";
import {
  DynamicSetConfig,
  DynamicSetObjectRule,
  DynamicSetRuleBlock,
} from "src/interfaces/skylark";
import { createUpdateObjectDynamicContentConfigurationMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

// interface ContentRule {
//   // This is an OR
//   blocks: RuleBlock[];
// }

const calculateSharedRelationships = (
  selectedObjectMetas?: SkylarkObjectMeta[],
): {
  sharedRelationships: SkylarkObjectRelationship[];
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
    [] as SkylarkObjectRelationship[],
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
        sharedRelationships: [] as SkylarkObjectRelationship[],
      },
    ) || { sharedRelationshipNames: [], sharedRelationships: [] }
  );
};

const ObjectRuleBlock = ({
  objectRule,
  validObjectTypes,
  hideUidInput,
  onChange,
}: {
  objectRule: DynamicSetObjectRule;
  validObjectTypes: string[];
  hideUidInput?: boolean;
  onChange: (r: DynamicSetObjectRule) => void;
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
    <div className="bg-manatee-200 p-4 mx-4 relative">
      <Select
        label="At least one object linked in the relationship"
        options={sharedRelationshipNames.map((relationshipName) => ({
          label: relationshipName,
          value: relationshipName,
        }))}
        variant="primary"
        labelVariant="form"
        placeholder=""
        className="my-2"
        onChange={(relationshipName) =>
          onChange({
            ...objectRule,
            relationshipName,
            objectType: sharedRelationships
              .filter((r) => r.relationshipName === relationshipName)
              .map(({ objectType }) => objectType)
              .filter((item, i, arr) => arr.indexOf(item) === i),
          })
        }
        selected={objectRule.relationshipName}
      />
      {!hideUidInput && (
        <TextInput
          label="Matching the uids (Optional, comma separated)"
          onChange={(str) =>
            onChange({
              ...objectRule,
              relatedUid: str ? str.trim().split(",") : undefined,
            })
          }
        />
      )}
    </div>
  );
};

const ContentRuleBlock = ({
  validObjectTypes,
  ruleBlock,
  objectTypesWithConfig,
  setRuleBlock,
}: {
  validObjectTypes: string[];
  ruleBlock: DynamicSetRuleBlock;
  objectTypesWithConfig: ObjectTypeWithConfig[];
  // setRuleBlock: Dispatch<SetStateAction<RuleBlock>>;
  setRuleBlock: (r: DynamicSetRuleBlock) => void;
}) => {
  const objectTypesToSearchOptions = objectTypesWithConfig
    .filter(({ objectType }) => validObjectTypes.includes(objectType))
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
    <div className="my-4 p-8 bg-manatee-300 w-full">
      <h3 className="text-2xl font-medium mb-2">Condition</h3>
      <MultiSelect
        label="Given objects matching the types:"
        labelVariant="form"
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

      <div className="px-4 bg-manatee-300 flex flex-col justify-center relative">
        {ruleBlock.objectRules.map((objectRule, i, arr) => (
          <div key={i} className="w-full relative">
            {i < arr.length && (
              <p className="my-4 font-medium">
                {i === 0 ? "That have" : "AND where objects returned have"}
              </p>
            )}
            <ObjectRuleBlock
              objectRule={objectRule}
              validObjectTypes={
                arr?.[i - 1]?.objectType || ruleBlock.objectTypesToSearch
              }
              onChange={(ruleBlock) => onObjectRuleChange(ruleBlock, i)}
              hideUidInput={i < arr.length - 1}
            />
            {arr.length > 1 && i === arr.length - 1 && (
              <div className="bottom-0 top-0 -right-4 absolute flex items-center">
                <Button
                  variant="ghost"
                  className="text-error"
                  onClick={() => deleteObjectRule(i)}
                >
                  <FiTrash2 className="text-xl" />
                </Button>
              </div>
            )}
          </div>
        ))}
        <Button variant="neutral" onClick={addObjectRule} className="mt-4">
          Add Rule
        </Button>
      </div>
    </div>
  );
};

const ListObjectContent = ({ uid }: { uid: string }) => {
  const { data, isLoading } = useGetObjectContent("SkylarkSet", uid);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (data.length === 0) {
    <p>Empty set</p>;
  }

  return (
    <div>
      {data.map(({ object, objectType, config, meta }) => (
        <ObjectIdentifierCard
          key={object.uid}
          object={{
            objectType,
            uid: object.uid,
            metadata: object,
            config,
            meta,
            availability: {
              status: meta.availabilityStatus,
              objects: [],
            },
          }}
        />
      ))}
    </div>
  );
};

export default function DynamicSets() {
  const { query } = useRouter();

  const [setUid, setSetUid] = useState("");

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig({
    withAvailabilityObjectType: false,
  });

  const [objectTypes, setObjectTypes] = useState<
    DynamicSetConfig["objectTypes"]
  >([]);

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

  return (
    <div className="w-full grid grid-cols-3 pt-32 mx-auto">
      <div className="w-full mx-auto flex max-w-3xl flex-col justify-start items-center text-sm col-span-2">
        {objectOperations && objectTypesWithConfig && (
          <>
            <MultiSelect
              label="Populate a Set with content matching the types"
              labelVariant="form"
              options={objectTypesWithConfig.map(({ objectType, config }) => ({
                label: config.objectTypeDisplayName || objectType,
                value: objectType,
              }))}
              selected={objectTypes}
              onChange={setObjectTypes}
              className="w-full"
            />
            {ruleBlocks.map((ruleBlock, i) => (
              <ContentRuleBlock
                key={i}
                ruleBlock={ruleBlock}
                validObjectTypes={objectTypes}
                objectTypesWithConfig={objectTypesWithConfig}
                setRuleBlock={(newRule) =>
                  setRuleBlocks((oldRules) =>
                    oldRules.map((oldRule, j) => (j === i ? newRule : oldRule)),
                  )
                }
              />
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
        <TextInput
          onChange={setSetUid}
          value={setUid}
          label="UID of Set to update"
          className="mb-4 mr-4"
        />
        <Button variant={"primary"}>Update</Button>
        {setUid ? (
          <ListObjectContent uid={setUid} />
        ) : (
          <>
            <p>DynamicSetInput:</p>
            <pre className="text-xs mt-2">
              {objectOperations &&
                objectTypes &&
                ruleBlocks &&
                print(
                  createUpdateObjectDynamicContentConfigurationMutation(
                    objectOperations,
                    { objectTypes, ruleBlocks },
                  ) as DocumentNode,
                )}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
