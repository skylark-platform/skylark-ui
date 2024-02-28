import clsx from "clsx";
import { IntrospectionEnumType } from "graphql";
import { useMemo } from "react";

import { Accordion } from "src/components/accordion";
import { EnumComparisonTable, SimpleTable } from "src/components/tables";
import { useSkylarkSchemaEnums } from "src/hooks/useSkylarkSchemaEnums";
import {
  ComparedEnum,
  ComparedEnumValue,
  compareSkylarkEnums,
} from "src/lib/skylark/introspection/schemaComparison";

import { CompareSchemaVersionsProps, DiffSection } from "./common.component";

const generateModifiedText = (name: string, values: ComparedEnumValue[]) => {
  const numAdded = values.filter(({ type }) => type === "added").length;
  const numRemoved = values.filter(({ type }) => type === "removed").length;
  const addedAndRemoved = numAdded > 0 && numRemoved > 0;

  return `${name} - ${numAdded > 0 ? `${numAdded} added` : ""}${addedAndRemoved ? ", " : ""}${numRemoved > 0 ? `${numRemoved} removed` : ""}`;
};

const ModifiedEnumSection = ({
  title,
  enums,
}: {
  title: string;
  enums: ComparedEnum[];
}) => (
  <DiffSection title={title} count={enums.length} type={"modified"} isEnums>
    {enums.map(({ name, values }) => {
      return (
        <Accordion key={name} buttonText={generateModifiedText(name, values)}>
          <EnumComparisonTable
            rows={values.map((obj) => ({ ...obj, id: obj.value }))}
          />
        </Accordion>
      );
    })}
  </DiffSection>
);

const UnmodifiedEnumSection = ({
  title,
  enums,
  type,
}: {
  title: string;
  enums: IntrospectionEnumType[];
  type: "unmodified" | "added" | "removed";
}) => (
  <DiffSection title={title} count={enums.length} type={type} isEnums>
    {enums.map(({ name, enumValues }) => {
      return (
        <Accordion
          key={name}
          buttonText={name}
          isSuccess={type === "added"}
          isError={type === "removed"}
        >
          <SimpleTable
            columns={[{ name: "Values", property: "name" }]}
            rows={enumValues.map(({ name }) => ({ name, id: name }))}
          />
        </Accordion>
      );
    })}
  </DiffSection>
);

export const EnumsDiff = ({
  baseVersionNumber,
  updateVersionNumber,
}: CompareSchemaVersionsProps) => {
  const { enums: baseEnums } = useSkylarkSchemaEnums({
    schemaVersion: baseVersionNumber,
  });

  const { enums: updateEnums } = useSkylarkSchemaEnums({
    schemaVersion: updateVersionNumber,
  });

  const enumsDiff = useMemo(() => {
    if (baseEnums && updateEnums) {
      const diff = compareSkylarkEnums(baseEnums, updateEnums);
      return diff;
    }

    return null;
  }, [baseEnums, updateEnums]);

  return enumsDiff ? (
    <div className="space-y-10 text-left">
      <ModifiedEnumSection title="Modified" enums={enumsDiff.modified} />
      <UnmodifiedEnumSection
        title="Removed"
        type="removed"
        enums={enumsDiff.removed}
      />
      <UnmodifiedEnumSection
        title="Added"
        type="added"
        enums={enumsDiff.added}
      />
      <UnmodifiedEnumSection
        title="Unmodified"
        type="unmodified"
        enums={enumsDiff.unmodified}
      />
    </div>
  ) : (
    <p>Loading...</p>
  );
};
