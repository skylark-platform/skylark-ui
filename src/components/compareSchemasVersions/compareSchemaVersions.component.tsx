import { ReactNode, useMemo, useState } from "react";

import { Accordion } from "src/components/accordion";
import { ObjectComparisonTable, SimpleTable } from "src/components/tables";
import { Tabs } from "src/components/tabs/tabs.component";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import { SkylarkObjectMeta } from "src/interfaces/skylark";
import {
  SkylarkSchemaComparisonModifiedObjectType,
  compareSkylarkSchemas,
  generateSchemaObjectTypeCountsText,
} from "src/lib/skylark/introspection/schemaComparison";

interface CompareSchemaVersionsProps {
  baseVersionNumber: number;
  updateVersionNumber: number;
}

/**
 * For each Object Type:
 * - If added: show added fields, added relationships
 * - If removed: show removed relationships (don't show fields)
 * - If modified: show modified fields, modified relationships -> Show existing too? Show in a changelog type way? Or preview type on hover (tooltip)?
 * - If unmodified: show nothing changed -> Or show everything like modified
 */

const Section = ({
  title,
  type,
  numObjectTypes,
  children,
}: {
  title: string;
  type: "unmodified" | "added" | "removed" | "modified";
  numObjectTypes: number;
  children: ReactNode;
}) => (
  <section>
    <h3 className="text-lg font-medium text-black">
      {title} ({numObjectTypes})
    </h3>
    {children}
    {numObjectTypes === 0 && <p className="mt-2">No object types {type}.</p>}
  </section>
);

const UnmodifiedObjectTypeSection = ({
  title,
  objectTypes,
  type,
}: {
  title: string;
  objectTypes: SkylarkObjectMeta[];
  type: "unmodified" | "added" | "removed";
}) => (
  <Section title={title} numObjectTypes={objectTypes.length} type={type}>
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
  </Section>
);

const ModifiedObjectTypeSection = ({
  title,
  objectTypes,
}: {
  title: string;
  objectTypes: SkylarkSchemaComparisonModifiedObjectType[];
}) => (
  <Section title={title} numObjectTypes={objectTypes.length} type={"modified"}>
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
  </Section>
);

export const CompareSchemaVersions = ({
  baseVersionNumber,
  updateVersionNumber,
}: CompareSchemaVersionsProps) => {
  const [activeTab, setActiveTab] = useState<string | null>();

  const { objects: baseObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: baseVersionNumber,
  });

  const { objects: updateObjectMeta } = useAllObjectsMeta(true, {
    schemaVersion: updateVersionNumber,
  });

  const objectTypeDiff = useMemo(() => {
    if (baseObjectMeta && updateObjectMeta) {
      const diff = compareSkylarkSchemas(baseObjectMeta, updateObjectMeta);
      return diff;
    }

    return null;
  }, [baseObjectMeta, updateObjectMeta]);

  const tabs = [
    { id: "objectTypes", name: "Object Types" },
    { id: "enums", name: "Enums (coming soon)" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="flex space-x-2 px-6 md:px-10">
        <Tabs
          tabs={tabs}
          selectedTab={activeTab || tabs?.[0].id}
          onChange={({ id }) => ""}
          className="border-b"
          disabled
        />
        {/* TODO - do we want to enable filtering by status? */}
        {/* <Select options={[{ value: "modified", label: "Modified" }]} /> */}
      </div>
      <div className="grow overflow-y-scroll py-6 px-6 md:px-10">
        {objectTypeDiff ? (
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
        )}
      </div>
    </div>
  );
};
