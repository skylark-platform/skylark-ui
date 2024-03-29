import { useMemo } from "react";

import { Accordion } from "src/components/accordion";
import { SimpleTable, ObjectComparisonTable } from "src/components/tables";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectMeta } from "src/interfaces/skylark";
import {
  SkylarkSchemaComparisonModifiedObjectType,
  generateSchemaObjectTypeCountsText,
  compareSkylarkObjectTypes,
} from "src/lib/skylark/introspection/schemaComparison";

import { CompareSchemaVersionsProps, DiffSection } from "./common.component";

const UnmodifiedObjectTypeSection = ({
  title,
  objectTypes,
  type,
}: {
  title: string;
  objectTypes: SkylarkObjectMeta[];
  type: "unmodified" | "added" | "removed";
}) => (
  <DiffSection title={title} count={objectTypes.length} type={type}>
    {objectTypes.map((objectMeta) => {
      return (
        <Accordion
          key={objectMeta.name}
          buttonText={objectMeta.name}
          isSuccess={type === "added"}
          isError={type === "removed"}
        >
          <>
            <h4 className="text-base font-medium mb-2 text-black">Fields</h4>
            <SimpleTable
              columns={[
                { name: "Name", property: "name" },
                { name: "Type", property: "originalType" },
                { name: "Is Required", property: "isRequired" },
              ]}
              rows={objectMeta.fields.map((field) => ({
                ...field,
                id: field.name,
              }))}
            />
            <h4 className="text-base font-medium mb-2 mt-8 text-black">
              Relationships
            </h4>
            {objectMeta.relationships.length > 0 ? (
              <SimpleTable
                columns={[
                  { name: "Name", property: "relationshipName" },
                  { name: "Object Type", property: "objectType" },
                ]}
                rows={objectMeta.relationships.map((rel) => ({
                  ...rel,
                  id: rel.relationshipName,
                }))}
              />
            ) : (
              <p>No relationships to other Object Types configured.</p>
            )}
          </>
        </Accordion>
      );
    })}
  </DiffSection>
);

const ModifiedObjectTypeSection = ({
  title,
  objectTypes,
}: {
  title: string;
  objectTypes: SkylarkSchemaComparisonModifiedObjectType[];
}) => (
  <DiffSection title={title} count={objectTypes.length} type={"modified"}>
    {objectTypes.map(
      ({ name, fields, relationships, fieldCounts, relationshipCounts }) => {
        const fieldChangesText = generateSchemaObjectTypeCountsText(
          "field",
          fieldCounts,
        );
        const relationshipChangesText = generateSchemaObjectTypeCountsText(
          "relationship",
          relationshipCounts,
        );
        const hasChanges = fieldChangesText || relationshipChangesText;
        const title = hasChanges
          ? `${name} - ${fieldChangesText}${fieldChangesText && relationshipChangesText ? ", " : ""}${relationshipChangesText}`
          : name;
        return (
          <Accordion key={name} buttonText={title} as="div">
            <h4 className="text-base font-medium mb-2 text-black">Fields</h4>
            <ObjectComparisonTable
              columns={[
                { name: "Name", property: "name" },
                { name: "Type", property: "originalType" },
                { name: "Is Required", property: "isRequired" },
              ]}
              rows={fields.map((field) => ({
                id: field.name,
                from: field.baseValue,
                to: field.updatedValue,
                modifiedProperties: field.modifiedProperties,
              }))}
            />
            <h4 className="text-base font-medium mb-2 mt-8 text-black">
              Relationships
            </h4>
            <ObjectComparisonTable
              columns={[
                { name: "Name", property: "relationshipName" },
                { name: "Object Type", property: "objectType" },
              ]}
              rows={relationships.map((rel) => ({
                id: rel.name,
                from: rel.baseValue,
                to: rel.updatedValue,
              }))}
            />
          </Accordion>
        );
      },
    )}
  </DiffSection>
);

export const ObjectTypesDiff = ({
  baseVersionNumber,
  updateVersionNumber,
}: CompareSchemaVersionsProps) => {
  const { objects: baseObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: baseVersionNumber,
  });

  const { objects: updateObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: updateVersionNumber,
  });

  const objectTypeDiff = useMemo(() => {
    if (baseObjectMeta && updateObjectMeta) {
      const diff = compareSkylarkObjectTypes(baseObjectMeta, updateObjectMeta);
      return diff;
    }

    return null;
  }, [baseObjectMeta, updateObjectMeta]);

  return objectTypeDiff ? (
    <div className="space-y-10 text-left">
      <ModifiedObjectTypeSection
        title="Modified"
        objectTypes={objectTypeDiff.objectTypes.modified}
      />
      <UnmodifiedObjectTypeSection
        title="Removed"
        type="removed"
        objectTypes={objectTypeDiff.objectTypes.removed}
      />
      <UnmodifiedObjectTypeSection
        title="Added"
        type="added"
        objectTypes={objectTypeDiff.objectTypes.added}
      />
      <UnmodifiedObjectTypeSection
        title="Unmodified"
        type="unmodified"
        objectTypes={objectTypeDiff.objectTypes.unmodified}
      />
    </div>
  ) : (
    <p>Loading...</p>
  );
};
