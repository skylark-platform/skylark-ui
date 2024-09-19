import clsx from "clsx";
import { Controller, UseFormReturn } from "react-hook-form";
import { FiTrash2 } from "react-icons/fi";

import { Button } from "src/components/button";
import { AddNewButton } from "src/components/contentModel/editor/contentModelRowInput.component";
import { TextInput } from "src/components/inputs/input";
import { ObjectTypeSelect, Select } from "src/components/inputs/select";
import { ObjectTypePill } from "src/components/pill";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";

import {
  ContentModelEditorForm,
  FieldHeader,
  SectionDescription,
  SectionHeader,
  SectionWrapper,
} from "./common.component";

interface RelationshipsSectionProps {
  form: UseFormReturn<ContentModelEditorForm>;
  objectMeta: SkylarkObjectMeta;
  allObjectsMeta: SkylarkObjectMeta[];
}

export const RelationshipsSection = ({
  form,
  objectMeta,
  allObjectsMeta,
}: RelationshipsSectionProps) => {
  const relationshipConfig = form.watch("relationshipConfig");

  const values = form.watch(`objectTypes.${objectMeta.name}.relationships`);

  const relationships = values || objectMeta.relationships;

  const addRelationship = () => {
    const newRelationshipNum = relationships.length;

    form.setValue(
      `objectTypes.${objectMeta.name}.relationships.${newRelationshipNum}`,
      {
        relationshipName: `relationship_${newRelationshipNum + 1}`,
        objectType: BuiltInSkylarkObjectType.SkylarkImage,
        reverseRelationshipName: null,
        isNew: true,
      },
      {
        shouldDirty: true,
      },
    );
  };

  return (
    <SectionWrapper data-testid="relationships-editor">
      <SectionHeader>Relationships</SectionHeader>
      <SectionDescription>
        Control the default sort field and whether relationships inherit
        availability from objects of this type.
      </SectionDescription>
      <div className="grid grid-cols-12 gap-4 text-manatee-400 font-normal text-sm mt-4 px-2">
        <FieldHeader className="col-span-2">Object Type</FieldHeader>
        <FieldHeader className="col-span-3">Name</FieldHeader>
        <FieldHeader className="col-span-3">{`Reverse name`}</FieldHeader>
        <FieldHeader className="col-span-3">Default Sort Field</FieldHeader>
        {/* <FieldHeader className="col-span-3">
          Availability Inheritance
        </FieldHeader> */}
      </div>
      {relationships.map(({ relationshipName }, index) => {
        return (
          <Controller
            key={`objectTypes.${objectMeta.name}.relationships.${index}`}
            name={`objectTypes.${objectMeta.name}.relationships.${index}`}
            control={form.control}
            render={({ field: hookField }) => {
              const { value } = hookField;
              const { objectType, isNew, isDeleted } = value;

              const config = relationshipConfig?.[relationshipName] || null;

              const relationshipObjectMeta = allObjectsMeta.find(
                ({ name }) => name === objectType,
              );

              return isNew && isDeleted ? (
                <></>
              ) : (
                <div
                  className={clsx(
                    "my-2 border rounded-lg text-sm items-center h-14 px-2 grid gap-4 grid-cols-12",
                    isDeleted
                      ? "bg-error/10 text-manatee-300 border-error/15"
                      : "bg-white shadow border-manatee-300",
                  )}
                  data-testid={`relationships-editor-row-${relationshipName}`}
                >
                  <div className="col-span-2">
                    {isNew ? (
                      <ObjectTypeSelect
                        variant="primary"
                        onChange={(c) =>
                          hookField.onChange({
                            ...value,
                            objectType: c.objectType,
                          })
                        }
                        selected={objectType}
                      />
                    ) : (
                      <ObjectTypePill
                        type={objectType}
                        className="w-full max-w-28 col-span-2"
                        forceActualName
                      />
                    )}
                  </div>
                  <div className="col-span-3">
                    {isNew ? (
                      <TextInput
                        value={relationshipName}
                        onChange={(str) =>
                          hookField.onChange({
                            ...value,
                            relationshipName: str,
                          })
                        }
                      />
                    ) : (
                      <p>{relationshipName}</p>
                    )}
                  </div>
                  <p className="col-span-3">{`parental_guidances`}</p>

                  <div className="col-span-3">
                    <Select
                      variant="primary"
                      placeholder={null}
                      disabled={!relationshipObjectMeta}
                      selected={config?.defaultSortField || ""}
                      onChange={(str) =>
                        form.setValue(
                          `relationshipConfig.${relationshipName}.defaultSortField`,
                          str,
                          { shouldDirty: true },
                        )
                      }
                      options={
                        relationshipObjectMeta?.fields.map(({ name }) => ({
                          label: name,
                          value: name,
                        })) ||
                        (config?.defaultSortField && [
                          {
                            value: config?.defaultSortField,
                            label: config?.defaultSortField,
                          },
                        ]) ||
                        []
                      }
                    />
                  </div>
                  {/* <div className="flex justify-start items-center col-span-3">
                    <Select
                      variant="primary"
                      placeholder=""
                      options={[
                        { label: "Off", value: 0 },
                        {
                          label: `${relationshipName} -> ${objectMeta.name}`,
                          value: 1,
                        },
                        {
                          label: `${objectMeta.name} -> ${relationshipName}`,
                          value: 2,
                        },
                      ]}
                    />
                  </div> */}
                  <div className="flex justify-start items-center col-span-1">
                    <Button
                      variant="ghost"
                      Icon={<FiTrash2 className="text-base text-error" />}
                      onClick={() =>
                        hookField.onChange({ ...value, isDeleted: true })
                      }
                    />
                  </div>
                </div>
              );
            }}
          />
        );
      })}
      {objectMeta.relationships.length === 0 && (
        <p className="mt-10">Object Type has no Relationships.</p>
      )}
      <AddNewButton text={`Add new relationship`} onClick={addRelationship} />
    </SectionWrapper>
  );
};
