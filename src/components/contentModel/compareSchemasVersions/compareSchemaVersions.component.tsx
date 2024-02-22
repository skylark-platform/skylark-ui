import { Disclosure } from "@headlessui/react";
import clsx from "clsx";
import { ReactNode, useMemo, useState } from "react";
import { FiCheck } from "react-icons/fi";

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

interface TableProps<TRow extends Record<string, string | boolean | string[]>> {
  columns: { property: keyof TRow; name: string }[];
  rows: (TRow & { id: string })[];
}

const Table = <TRow extends Record<string, string | string[] | boolean>>({
  columns,
  rows,
}: TableProps<TRow>) => {
  return (
    <table className="w-full border">
      <thead className="border-b text-black">
        {columns.map(({ property, name }) => (
          <td key={String(property)} className="p-1">
            {name}
          </td>
        ))}
      </thead>
      <tbody className="p-2">
        {rows.map((field) => (
          <tr key={field.id} className="">
            {columns.map(({ property }) => {
              const val = field[property];
              const type = typeof val;
              const isArr = Array.isArray(val);

              return (
                <td
                  key={`${field.id}-${String(property)}`}
                  className="px-1 py-0.5"
                >
                  {type === "string" && val}
                  {isArr && val.join(", ")}
                  {type === "boolean" && val === true && (
                    <FiCheck className="text-lg" />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Accordion = ({
  isSuccess,
  isError,
  isWarning,
  buttonText,
  children,
}: {
  isSuccess?: boolean;
  isError?: boolean;
  isWarning?: boolean;
  buttonText: string;
  children: ReactNode;
}) => (
  <Disclosure>
    <Disclosure.Button
      className={clsx(
        "px-4 mt-4 flex justify-between text-left py-2 w-full border rounded",
        isSuccess && "bg-success/10 border-success",
        isError && "bg-error/10 border-error",
        isWarning && "bg-warning/10 border-warning",
        !isSuccess &&
          !isError &&
          !isWarning &&
          "bg-manatee-100 border-manatee-300",
      )}
    >
      <span>{buttonText}</span>
      <span>D</span>
    </Disclosure.Button>
    <Disclosure.Panel
      className={clsx(
        "text-gray-500 p-4 rounded-b-lg",
        isSuccess && "bg-success/5",
        isError && "bg-error/5",
        isWarning && "bg-warning/5",
        !isSuccess && !isError && !isWarning && "bg-manatee-50",
      )}
    >
      {children}
    </Disclosure.Panel>
  </Disclosure>
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
          <Accordion
            key={name}
            buttonText={title}
            // isWarning
          >
            <table className="w-full border mb-4">
              <thead className="border-b text-black">
                {["Field", "Type", "Is Required"].map((name) => (
                  <td key={name} className="p-1">
                    {name}
                  </td>
                ))}
              </thead>
              <tbody className="p-2">
                {fields.map(
                  ({
                    name: field,
                    type,
                    baseValue,
                    updatedValue,
                    modifiedProperties,
                  }) => {
                    return (
                      <tr
                        key={field}
                        className={clsx(
                          type === "added" && "bg-success/20",
                          type === "removed" && "bg-error/20",
                          type === "modified" && "bg-warning/20",
                        )}
                      >
                        <td
                          className={clsx(
                            "px-1 py-0.5",
                            type === "removed" && "line-through",
                          )}
                        >
                          {field}
                        </td>
                        <td
                          className={clsx(
                            "px-1 py-0.5",
                            type === "removed" && "line-through",
                          )}
                        >
                          {type === "modified" &&
                            (modifiedProperties?.includes("originalType")
                              ? `${baseValue?.originalType} -> ${updatedValue?.originalType}`
                              : baseValue?.originalType)}
                          {type === "equal" && baseValue?.originalType}
                          {type === "removed" && baseValue?.originalType}
                          {type === "added" && updatedValue?.originalType}
                        </td>
                        <td
                          className={clsx(
                            "px-1 py-0.5",
                            type === "removed" && "line-through",
                          )}
                        >
                          {type === "modified" &&
                            (modifiedProperties?.includes("isRequired")
                              ? `${baseValue?.isRequired} -> ${updatedValue?.isRequired}`
                              : baseValue?.isRequired && "true")}
                          {type === "equal" && baseValue?.isRequired && "true"}
                          {type === "removed" &&
                            baseValue?.isRequired &&
                            "true"}
                          {type === "added" &&
                            updatedValue?.isRequired &&
                            "true"}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>

            <table className="w-full border">
              <thead className="border-b text-black">
                {["Relationship", "Object Type"].map((name) => (
                  <td key={name} className="p-1">
                    {name}
                  </td>
                ))}
              </thead>
              <tbody className="p-2">
                {relationships.map(
                  ({ name, type, baseValue, updatedValue }) => {
                    return (
                      <tr
                        key={name}
                        className={clsx(
                          type === "added" && "bg-success/20",
                          type === "removed" && "bg-error/20",
                          type === "modified" && "bg-warning/20",
                        )}
                      >
                        <td
                          className={clsx(
                            "px-1 py-0.5",
                            type === "removed" && "line-through",
                          )}
                        >
                          {name}
                        </td>
                        <td
                          className={clsx(
                            "px-1 py-0.5",
                            type === "removed" && "line-through",
                          )}
                        >
                          {type === "modified" &&
                            (baseValue?.objectType !== updatedValue?.objectType
                              ? `${baseValue?.objectType} -> ${updatedValue?.objectType}`
                              : baseValue?.objectType)}
                          {type === "equal" && baseValue?.objectType}
                          {type === "removed" && baseValue?.objectType}
                          {type === "added" && updatedValue?.objectType}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
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
    <Table
      columns={[
        "name" as const,
        "originalType" as const,
        "isRequired" as const,
      ].map((name) => ({ name, property: name }))}
      rows={fields.map((field) => ({
        ...field,
        id: field.name,
      }))}
    />
    <h4 className="text-base font-medium mb-2 mt-4">Relationships</h4>
    {relationships.length > 0 ? (
      <Table
        columns={["relationshipName" as const, "objectType" as const].map(
          (name) => ({ name, property: name }),
        )}
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
    { id: "enums", name: "Enums" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      <div className="">
        <p className="text-center font-medium mb-2">{`Comparing base version ${baseVersionNumber} to version ${updateVersionNumber}`}</p>
        <Tabs
          tabs={tabs}
          selectedTab={activeTab || tabs?.[0].id}
          onChange={({ id }) => ""}
          className="border-b"
        />
      </div>
      {objectTypeDiff ? (
        <div className="grow overflow-y-scroll py-10">
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
