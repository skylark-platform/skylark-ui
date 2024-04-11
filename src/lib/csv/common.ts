import dayjs from "dayjs";
import { EnumType } from "json-to-graphql-query";

import { TEMPLATE_FIELDS_TO_IGNORE } from "src/constants/csv";
import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  NormalizedObjectFieldType,
  ParsedSkylarkDimensionsWithValues,
  SkylarkObjectMeta,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { parseInputFieldValue } from "src/lib/skylark/parsers";

const generateExampleFieldData = (
  { type, enumValues }: NormalizedObjectField,
  rowNum: number,
): string | number | boolean | EnumType | string[] | null => {
  const now = dayjs();
  const examples: Record<
    NormalizedObjectFieldType,
    (string | number | boolean | EnumType | string[] | null)[]
  > = {
    string: ["example"],
    int: [10, -5],
    float: [1.2, 20.23, 0.2],
    boolean: [true, false],
    enum: enumValues as string[],
    url: ["http://example.com", "https://example.com"],
    date: [
      parseInputFieldValue(now.format("YYYY-MM-DD"), type),
      parseInputFieldValue("2011-02-02", type),
    ],
    datetime: [
      parseInputFieldValue(now.toISOString(), type),
      parseInputFieldValue("2023-03-06T11:12:05Z", type),
    ],
    time: [
      parseInputFieldValue(now.format("HH:mm:ss"), "time"),
      "14:04",
      "10:30:11",
    ],
    timestamp: [
      parseInputFieldValue(now.unix(), "timestamp"),
      parseInputFieldValue("1678101125", "timestamp"),
    ],
    email: ["customer@email.com", "mail@email.co.uk"],
    ipaddress: ["0.0.0.0", "9.255.255.255", "21DA:D3:0:2F3B:2AA:FF:FE28:9C5A"],
    json: [],
    phone: ["+447975777666", "+12025886500"],
  };

  return examples[type]?.[rowNum] !== "" &&
    examples[type]?.[rowNum] !== undefined
    ? examples[type]?.[rowNum]
    : "";
};

export const generateExampleCSV = (
  objectMeta: SkylarkObjectMeta | null,
  translationFieldsOnly: boolean,
  dromoImport: boolean,
  dimensions?: ParsedSkylarkDimensionsWithValues[],
): string | null => {
  if (!objectMeta) {
    return null;
  }

  const inputs = objectMeta.operations.create.inputs.filter(
    ({ name }) =>
      !TEMPLATE_FIELDS_TO_IGNORE.includes(name) &&
      (!translationFieldsOnly ||
        objectMeta.fieldConfig.translatable.includes(name) ||
        name === SkylarkSystemField.ExternalID),
  );

  console.log({ inputs });

  if (!inputs || inputs.length === 0) {
    return null;
  }

  const columns = inputs.map(({ name, isRequired }) =>
    isRequired ? `${name} (required)` : name,
  );

  if (dromoImport && !translationFieldsOnly && objectMeta.hasRelationships) {
    const relationshipNames = objectMeta.relationships
      .map(({ relationshipName }) => [
        `${relationshipName} (1)`,
        `${relationshipName} (2)`,
        `${relationshipName} (3)`,
      ])
      .flatMap((arr) => arr);
    columns.push(...relationshipNames);
  }

  const dimensionColumns = [];
  if (objectMeta.name === BuiltInSkylarkObjectType.Availability) {
    if (!dimensions) {
      return null;
    }

    const dCols = dimensions
      .map(({ title, slug, external_id, uid, values }) =>
        values.map(
          (_, i) => `${title || slug || external_id || uid} (${i + 1})`,
        ),
      )
      .flatMap((arr) => arr);

    columns.push(...dCols);
    dimensionColumns.push(...dCols);
  }

  const joinedColumns = columns.join(",");

  const blankRow = inputs.length > 1 ? ",".repeat(inputs.length - 1) : ",";

  const exampleRows: string[] = [];

  let exampleRowNum = 0;
  while (
    exampleRows[exampleRows.length - 1] !== blankRow &&
    exampleRows[exampleRows.length - 1] !== ""
  ) {
    const examples = inputs.map((input) =>
      generateExampleFieldData(input, exampleRowNum),
    );

    if (
      exampleRowNum < 2 &&
      objectMeta.name === BuiltInSkylarkObjectType.Availability &&
      dimensions &&
      dimensionColumns.length > 0
    ) {
      dimensions.forEach(({ values }) => {
        const exampleValues = values.map(
          (val) => val.title || val.slug || val.external_id || val.uid,
        );
        examples.push(...exampleValues);
      });
    }

    exampleRowNum += 1;
    exampleRows.push(examples.join(","));
  }

  const csv = [joinedColumns, ...exampleRows].join("\n");
  return csv;
};
