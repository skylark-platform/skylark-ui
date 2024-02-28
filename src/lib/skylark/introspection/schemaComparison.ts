import { IntrospectionEnumType } from "graphql";

import {
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";

export type SchemaObjectTypePropertyComparisonType =
  | "equal"
  | "added"
  | "removed"
  | "modified";

interface ComparedObjectProperty<T> {
  name: string;
  baseValue: T | null;
  updatedValue: T | null;
  type: SchemaObjectTypePropertyComparisonType;
}

interface ComparedObjectField
  extends ComparedObjectProperty<NormalizedObjectField> {
  modifiedProperties?: string[];
}

interface ComparedObjectRelationship
  extends ComparedObjectProperty<SkylarkObjectRelationship> {}

export type ComparedEnumValue = {
  value: string;
  type: Omit<SchemaObjectTypePropertyComparisonType, "modified">;
};

export interface ComparedEnum {
  name: string;
  values: ComparedEnumValue[];
}

export type SchemaComparedObjectTypeCounts = Record<
  SchemaObjectTypePropertyComparisonType,
  number
>;

export interface SkylarkSchemaComparisonModifiedObjectType {
  name: string;
  fields: ComparedObjectField[];
  fieldsIsEqual: boolean;
  fieldCounts: SchemaComparedObjectTypeCounts;
  relationships: ComparedObjectRelationship[];
  relationshipsIsEqual: boolean;
  relationshipCounts: SchemaComparedObjectTypeCounts;
  isEqual: boolean;
}

export interface SkylarkSchemaComparisonObjectTypesDiff {
  added: SkylarkObjectMeta[];
  removed: SkylarkObjectMeta[];
  unmodified: SkylarkObjectMeta[];
  modified: SkylarkSchemaComparisonModifiedObjectType[];
  isEqual: boolean;
}

interface SkylarkSchemaComparison {
  objectTypes: SkylarkSchemaComparisonObjectTypesDiff;
}

const diffObjectMetasFields = (
  baseFields: NormalizedObjectField[],
  updatedFields: NormalizedObjectField[],
) => {
  // Calculate added and removed fields
  const addedFields = updatedFields.filter(
    (field) => !baseFields.find(({ name }) => name === field.name),
  );
  const removedFields = baseFields.filter(
    (field) => !updatedFields.find(({ name }) => name === field.name),
  );

  // If fields have been added or removed we don't need to check differing types so ignore them
  const fieldsToIgnore = [
    ...addedFields.map(({ name }) => name),
    ...removedFields.map(({ name }) => name),
  ];
  const commonFields = updatedFields.filter(
    ({ name }) => !fieldsToIgnore.includes(name),
  );

  // Calculate different field types
  const comparedFields: ComparedObjectField[] = commonFields
    .map((field): ComparedObjectField | null => {
      const baseField = baseFields.find(({ name }) => name === field.name);
      const updatedField = updatedFields.find(
        ({ name }) => name === field.name,
      );

      if (!baseField || !updatedField) {
        // Should never hit this case
        return null;
      }

      const modifiedProperties: string[] = (
        Object.keys(field) as (keyof NormalizedObjectField)[]
      ).reduce((prev, key) => {
        const base = baseField[key];
        const updated = updatedField[key];
        const isModified = base !== updated;

        return isModified ? [...prev, key] : prev;
      }, [] as string[]);

      return {
        name: field.name,
        type: modifiedProperties.length > 0 ? "modified" : "equal",
        baseValue: baseField,
        updatedValue: updatedField,
        modifiedProperties,
      };
    })
    .filter((fieldDiff): fieldDiff is ComparedObjectField =>
      Boolean(fieldDiff),
    );

  const numModifiedFields = comparedFields.filter(
    ({ type }) => type === "modified",
  ).length;

  const isEqual =
    addedFields.length === 0 &&
    removedFields.length === 0 &&
    numModifiedFields === 0;

  const addedComparedFields = addedFields.map(
    (field): ComparedObjectField => ({
      name: field.name,
      type: "added",
      baseValue: null,
      updatedValue: field,
    }),
  );
  const removedComparedFields = removedFields.map(
    (field): ComparedObjectField => ({
      name: field.name,
      type: "removed",
      baseValue: field,
      updatedValue: null,
    }),
  );

  const fields: ComparedObjectField[] = [
    ...comparedFields,
    ...removedComparedFields,
    ...addedComparedFields,
  ];

  return {
    fields,
    isEqual,
    counts: {
      added: addedFields.length,
      removed: removedFields.length,
      modified: numModifiedFields,
      equal: comparedFields.length - numModifiedFields,
    },
  };
};

const diffObjectMetasRelationships = (
  baseRelationships: SkylarkObjectRelationship[],
  updatedRelationships: SkylarkObjectRelationship[],
) => {
  // Calculate added and removed relationships
  const addedRelationships = updatedRelationships.filter(
    (rel) =>
      !baseRelationships.find(
        ({ relationshipName }) => relationshipName === rel.relationshipName,
      ),
  );
  const removedRelationships = baseRelationships.filter(
    (rel) =>
      !updatedRelationships.find(
        ({ relationshipName }) => relationshipName === rel.relationshipName,
      ),
  );

  // If relationships have been added or removed we don't need to check differing objectTypes so ignore them
  const relationshipsToIgnore = [
    ...addedRelationships.map(({ relationshipName }) => relationshipName),
    ...removedRelationships.map(({ relationshipName }) => relationshipName),
  ];
  const commonRelationships = updatedRelationships.filter(
    ({ relationshipName }) => !relationshipsToIgnore.includes(relationshipName),
  );

  const comparedRelationships: ComparedObjectRelationship[] =
    commonRelationships
      .map((rel): ComparedObjectRelationship | null => {
        const baseRel = baseRelationships.find(
          ({ relationshipName }) => relationshipName === rel.relationshipName,
        );
        const updatedRel = updatedRelationships.find(
          ({ relationshipName }) => relationshipName === rel.relationshipName,
        );

        if (!baseRel || !updatedRel) {
          // Should never hit this case
          return null;
        }

        const isModified = baseRel.objectType !== updatedRel.objectType;

        return {
          name: rel.relationshipName,
          baseValue: baseRel,
          updatedValue: updatedRel,
          type: isModified ? "modified" : "equal",
        };
      })
      .filter((relDiff): relDiff is ComparedObjectRelationship =>
        Boolean(relDiff),
      );

  const numberModifiedRelationships = comparedRelationships.filter(
    ({ type }) => type === "modified",
  ).length;

  const isEqual =
    addedRelationships.length === 0 &&
    removedRelationships.length === 0 &&
    numberModifiedRelationships === 0;

  const addedComparedFields = addedRelationships.map(
    (rel): ComparedObjectRelationship => ({
      name: rel.relationshipName,
      type: "added",
      baseValue: null,
      updatedValue: rel,
    }),
  );
  const removedComparedFields = removedRelationships.map(
    (rel): ComparedObjectRelationship => ({
      name: rel.relationshipName,
      type: "removed",
      baseValue: rel,
      updatedValue: null,
    }),
  );

  const relationships: ComparedObjectRelationship[] = [
    ...comparedRelationships,
    ...removedComparedFields,
    ...addedComparedFields,
  ];

  return {
    relationships,
    isEqual,
    counts: {
      added: addedRelationships.length,
      removed: removedRelationships.length,
      modified: numberModifiedRelationships,
      equal: comparedRelationships.length - numberModifiedRelationships,
    },
  };
};

const diffObjectMetas = (
  baseObjectMeta: SkylarkObjectMeta,
  updatedObjectMeta: SkylarkObjectMeta,
): Omit<SkylarkSchemaComparisonModifiedObjectType, "name"> => {
  const {
    fields,
    isEqual: fieldsIsEqual,
    counts: fieldCounts,
  } = diffObjectMetasFields(baseObjectMeta.fields, updatedObjectMeta.fields);

  const {
    relationships,
    isEqual: relationshipsIsEqual,
    counts: relationshipCounts,
  } = diffObjectMetasRelationships(
    baseObjectMeta.relationships,
    updatedObjectMeta.relationships,
  );

  return {
    fields,
    fieldsIsEqual,
    fieldCounts,
    relationships,
    relationshipsIsEqual,
    relationshipCounts,
    isEqual: fieldsIsEqual && relationshipsIsEqual,
  };
};

export const compareSkylarkObjectTypes = (
  baseSchema: SkylarkObjectMeta[],
  updatedSchema: SkylarkObjectMeta[],
): SkylarkSchemaComparison => {
  // Calculate added and removed Object Types
  const baseSchemaObjectTypes = baseSchema.map(({ name }) => name);
  const updatedSchemaObjectTypes = updatedSchema.map(({ name }) => name);

  const addedObjectTypes = updatedSchema.filter(
    ({ name }) => !baseSchemaObjectTypes.includes(name),
  );
  const removedObjectTypes = baseSchema.filter(
    ({ name }) => !updatedSchemaObjectTypes.includes(name),
  );

  // If Object Types have been added or removed, we don't need to calculate removed/added fields or relationships so ignore them
  const objectTypesToIgnore = [...addedObjectTypes, ...removedObjectTypes].map(
    ({ name }) => name,
  );

  const commonObjectTypes = updatedSchemaObjectTypes.filter(
    (objectType) => !objectTypesToIgnore.includes(objectType),
  );

  // Calculate differences for Object Types in both versions
  const commonObjectTypesDiffs = commonObjectTypes
    .map((objectType) => {
      const baseSchemaObjectType = baseSchema.find(
        ({ name }) => name === objectType,
      );
      const updatedSchemaObjectType = updatedSchema.find(
        ({ name }) => name === objectType,
      );

      if (!baseSchemaObjectType || !updatedSchemaObjectType) {
        // Should never hit this case
        return null;
      }

      return {
        name: objectType,
        ...diffObjectMetas(baseSchemaObjectType, updatedSchemaObjectType),
      };
    })
    .filter((entry): entry is SkylarkSchemaComparisonModifiedObjectType =>
      Boolean(entry),
    );

  const modifiedObjectTypes = commonObjectTypesDiffs.filter(
    ({ isEqual }) => !isEqual,
  );

  const unmodifiedObjectTypes = baseSchema.filter(
    ({ name }) =>
      !objectTypesToIgnore.includes(name) &&
      !modifiedObjectTypes.find((modified) => name === modified.name),
  );

  const isEqual =
    addedObjectTypes.length === 0 &&
    removedObjectTypes.length === 0 &&
    modifiedObjectTypes.length === 0 &&
    unmodifiedObjectTypes.length === commonObjectTypesDiffs.length;

  const objectTypes: SkylarkSchemaComparisonObjectTypesDiff = {
    added: addedObjectTypes,
    removed: removedObjectTypes,
    modified: modifiedObjectTypes,
    unmodified: unmodifiedObjectTypes,
    isEqual,
  };

  return {
    objectTypes,
  };
};

export const generateSchemaObjectTypeCountsText = (
  type: "field" | "relationship",
  countsWithEqual: SchemaComparedObjectTypeCounts,
) => {
  const counts = { ...countsWithEqual, equal: 0 };

  const propertiesWithChanges = Object.entries(counts)
    .map(([key, value]) => (value > 0 ? key : null))
    .filter((key): key is SchemaObjectTypePropertyComparisonType =>
      Boolean(key),
    );

  if (propertiesWithChanges.length === 0) {
    return "";
  }

  if (propertiesWithChanges.length === 1) {
    const count = counts[propertiesWithChanges[0]];
    const plural = count > 1 ? `${type}s` : type;
    return `${count} ${plural} ${propertiesWithChanges[0]}`;
  }

  const totalCount = Object.values(counts).reduce(
    (prev, count) => (prev += count),
    0,
  );

  const plural = totalCount > 1 ? `${type}s` : type;

  return `${totalCount} ${plural} changed`;
};

export const compareSkylarkEnums = (
  baseEnums: IntrospectionEnumType[],
  updatedEnums: IntrospectionEnumType[],
) => {
  // Calculate added and removed Enums
  const baseEnumNames = baseEnums.map(({ name }) => name);
  const updateEnumNames = updatedEnums.map(({ name }) => name);

  const addedEnums = updatedEnums.filter(
    ({ name }) => !baseEnumNames.includes(name),
  );
  const removedEnums = baseEnums.filter(
    ({ name }) => !updateEnumNames.includes(name),
  );

  // If Enums have been added or removed, we don't need to calculate which values are different
  const enumsToIgnore = [...addedEnums, ...removedEnums].map(
    ({ name }) => name,
  );

  const commonEnums = updatedEnums.filter(
    ({ name }) => !enumsToIgnore.includes(name),
  );

  // Calculate added/removed enum values
  const modifiedEnums = commonEnums
    .map(({ name: enumName }) => {
      const baseEnum = baseEnums.find(({ name }) => name === enumName);
      const updatedEnum = updatedEnums.find(({ name }) => name === enumName);

      if (!baseEnum || !updatedEnum) {
        // Should never hit this case
        return null;
      }

      const baseValues = baseEnum.enumValues.map(({ name }) => name);
      const updatedValues = updatedEnum.enumValues.map(({ name }) => name);
      const combinedValues = [...new Set([...baseValues, ...updatedValues])];

      const validatedValues = combinedValues.map(
        (value): ComparedEnum["values"][0] => {
          const valueInBase = baseValues.includes(value);
          const valueInUpdated = updatedValues.includes(value);

          if (valueInBase && valueInUpdated) {
            return {
              value,
              type: "equal",
            };
          }

          return {
            value,
            type: valueInBase ? "removed" : "added",
          };
        },
      );

      const hasChanges =
        validatedValues.filter(({ type }) => type !== "equal").length > 0;

      if (!hasChanges) {
        return null;
      }

      return {
        name: enumName,
        values: validatedValues,
      };
    })
    .filter((entry): entry is ComparedEnum => Boolean(entry));

  const unmodifiedEnums = commonEnums.filter(
    ({ name }) => !modifiedEnums.find((e) => e.name === name),
  );

  return {
    added: addedEnums,
    removed: removedEnums,
    modified: modifiedEnums,
    unmodified: unmodifiedEnums,
  };
};
