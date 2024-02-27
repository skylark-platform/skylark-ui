import clsx from "clsx";
import { useMemo, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

import { Accordion } from "src/components/accordion";
import { ObjectComparisonTable, SimpleTable } from "src/components/tables";
import { Tabs } from "src/components/tabs/tabs.component";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";
import {
  SkylarkSchemaComparisonModifiedObjectType,
  compareSkylarkSchemas,
  generateSchemaObjectTypeCountsText,
} from "src/lib/skylark/introspection/schemaComparison";

interface CompareSchemaVersionsProps {
  baseVersionNumber: number;
  updateVersionNumber: number;
}

type TabID = "MODIFIED" | "UNMODIFIED" | "ADDED" | "REMOVED";

/**
 * For each Object Type:
 * - If added: show added fields, added relationships
 * - If removed: show removed relationships (don't show fields)
 * - If modified: show modified fields, modified relationships -> Show existing too? Show in a changelog type way? Or preview type on hover (tooltip)?
 * - If unmodified: show nothing changed -> Or show everything like modified
 */

const IsRequiredTickCross = ({
  value,
  displayFalsy,
}: {
  value?: boolean | null;
  displayFalsy?: boolean;
}) =>
  value ? (
    <FiCheck className="text-lg" />
  ) : displayFalsy ? (
    <FiX className="text-lg" />
  ) : null;

const UnmodifiedObjectTypeSection = ({
  title,
  objectTypes,
  type,
}: {
  title: string;
  objectTypes: SkylarkObjectMeta[];
  type: "unmodified" | "added" | "removed";
}) => (
  <div className="">
    <h3 className="text-lg font-medium">
      {title} ({objectTypes.length})
    </h3>
    {objectTypes.map((objectMeta) => {
      return (
        <Accordion
          key={objectMeta.name}
          buttonText={objectMeta.name}
          isSuccess={type === "added"}
          isError={type === "removed"}
        >
          <ObjectTypeFieldsAndRelationships
            fields={objectMeta.fields}
            relationships={objectMeta.relationships}
          />
        </Accordion>
      );
    })}
    {objectTypes.length === 0 && (
      <p className="mt-2">No object types {type}.</p>
    )}
  </div>
);

const ModifiedObjectTypeSection = ({
  title,
  objectTypes,
}: {
  title: string;
  objectTypes: SkylarkSchemaComparisonModifiedObjectType[];
}) => (
  <div className="">
    <h3 className="text-lg font-medium">
      {title} ({objectTypes.length})
    </h3>
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
            <ObjectComparisonTable
              columns={[
                { name: "Field", property: "name" },
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
            <ObjectComparisonTable
              columns={[
                { name: "Relationship", property: "relationshipName" },
                { name: "Object Type", property: "objectType" },
              ]}
              rows={relationships.map((rel) => ({
                id: rel.name,
                from: rel.baseValue,
                to: rel.updatedValue,
              }))}
              className="mt-8"
            />
          </Accordion>
        );
      },
    )}
  </div>
);

const ObjectTypeFieldsAndRelationships = ({
  fields,
  relationships,
}: {
  fields: NormalizedObjectField[];
  relationships: SkylarkObjectRelationship[];
}) => (
  <>
    <h4 className="text-base font-medium mb-2">Fields</h4>
    <SimpleTable
      columns={[
        { name: "Name", property: "name" },
        { name: "Type", property: "originalType" },
        { name: "Is Required", property: "isRequired" },
      ]}
      rows={fields.map((field) => ({
        ...field,
        id: field.name,
      }))}
    />
    <h4 className="text-base font-medium mb-2 mt-4">Relationships</h4>
    {relationships.length > 0 ? (
      <SimpleTable
        columns={[
          { name: "Name", property: "relationshipName" },
          { name: "Object Type", property: "objectType" },
        ]}
        rows={relationships.map((rel) => ({
          ...rel,
          id: rel.relationshipName,
        }))}
      />
    ) : (
      <p>No relationships to other Object Types configured.</p>
    )}
  </>
);

export const CompareSchemaVersions = ({
  baseVersionNumber,
  updateVersionNumber,
}: CompareSchemaVersionsProps) => {
  const [activeTab, setActiveTab] = useState<TabID | null>(null);

  const { objects: baseObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: baseVersionNumber, // Test using: 196
  });

  const { objects: updateObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: updateVersionNumber, // Test using: 10
  });

  const objectTypeDiff = useMemo(() => {
    if (baseObjectMeta && updateObjectMeta) {
      const diff = compareSkylarkSchemas(baseObjectMeta, updateObjectMeta);

      console.log({ diff });

      return diff;
    }

    return null;
  }, [baseObjectMeta, updateObjectMeta]);

  const tabs = [
    { id: "objectTypes", name: "Object Types" },
    // { id: "enums", name: "Enums" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="">
        <h3 className="text-center font-semibold text-xl">Schema Comparison</h3>
        <p className="text-center font-medium mb-2">{`Comparing base version ${baseVersionNumber} to version ${updateVersionNumber}`}</p>
        <div className="flex space-x-2">
          <Tabs
            tabs={tabs}
            selectedTab={activeTab || tabs?.[0].id}
            onChange={({ id }) => ""}
            className="border-b"
          />
          {/* TODO - do we want to enable filtering by status? */}
          {/* <Select options={[{ value: "modified", label: "Modified" }]} /> */}
        </div>
      </div>
      {objectTypeDiff ? (
        <div className="grow overflow-y-scroll py-6">
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
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};
