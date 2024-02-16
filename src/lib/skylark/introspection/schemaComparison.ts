import {
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";

interface SkylarkSchemaComparisonObjectTypeFieldsDiff {
  added: NormalizedObjectField[];
  removed: NormalizedObjectField[];
  modified: {
    name: string;
    values: never[];
    isModified: boolean;
  }[];
  unmodified: NormalizedObjectField[];
  isEqual: boolean;
}

interface SkylarkSchemaComparisonObjectTypeRelationshipsDiff {
  added: SkylarkObjectRelationship[];
  removed: SkylarkObjectRelationship[];
  modified: {
    name: string;
    values: never[];
    isModified: boolean;
  }[];
  unmodified: SkylarkObjectRelationship[];
  isEqual: boolean;
}

interface SkylarkSchemaComparisonObjectTypeDiff {
  objectType: string;
  fields: SkylarkSchemaComparisonObjectTypeFieldsDiff;
  relationships: SkylarkSchemaComparisonObjectTypeRelationshipsDiff;
  isEqual: boolean;
}

interface SkylarkSchemaComparisonObjectTypesDiff {
  added: string[];
  removed: string[];
  modified: SkylarkSchemaComparisonObjectTypeDiff[];
  unmodified: SkylarkSchemaComparisonObjectTypeDiff[];
  isEqual: boolean;
}

interface SkylarkSchemaComparison {
  objectTypes: SkylarkSchemaComparisonObjectTypesDiff;
}

const diffObjectMetasFields = (
  baseFields: NormalizedObjectField[],
  updatedFields: NormalizedObjectField[],
): SkylarkSchemaComparisonObjectTypeFieldsDiff => {
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
  const modifiedFields = commonFields
    .map((field) => {
      const baseField = baseFields.find(({ name }) => name === field.name);
      const updatedField = updatedFields.find(
        ({ name }) => name === field.name,
      );

      if (!baseField || !updatedField) {
        // Should never hit this case
        return null;
      }

      const fieldDiff = (
        Object.keys(field) as (keyof NormalizedObjectField)[]
      ).reduce(
        (prev, key) => {
          const base = baseField[key];
          const updated = updatedField[key];
          const isModified = base !== updated;

          return {
            ...prev,
            isModified: prev.isModified || isModified,
            values: {
              ...prev.values,
              [key]: {
                base,
                updated,
                isModified,
              },
            },
          };
        },
        { name: field.name, values: [], isModified: false },
      );

      return fieldDiff;
    })
    .filter(
      (
        fieldDiff,
      ): fieldDiff is {
        name: string;
        values: never[];
        isModified: boolean;
      } => Boolean(fieldDiff && fieldDiff.isModified),
    );

  const unmodifiedFields = commonFields.filter(
    (field) => !modifiedFields.find(({ name }) => name === field.name),
  );

  const isEqual =
    addedFields.length === 0 &&
    removedFields.length === 0 &&
    modifiedFields.length === 0 &&
    unmodifiedFields.length === commonFields.length;

  return {
    added: addedFields,
    removed: removedFields,
    modified: modifiedFields,
    unmodified: unmodifiedFields,
    isEqual,
  };
};

const diffObjectMetasRelationships = (
  baseRelationships: SkylarkObjectRelationship[],
  updatedRelationships: SkylarkObjectRelationship[],
): SkylarkSchemaComparisonObjectTypeRelationshipsDiff => {
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

  // Calculate different field types
  const modifiedRelationships = commonRelationships
    .map((rel) => {
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

      const fieldDiff = (
        Object.keys(rel) as (keyof SkylarkObjectRelationship)[]
      ).reduce(
        (prev, key) => {
          const base = baseRel[key];
          const updated = updatedRel[key];
          const isModified = base !== updated;

          return {
            ...prev,
            isModified: prev.isModified || isModified,
            values: {
              ...prev.values,
              [key]: {
                base,
                updated,
                isModified,
              },
            },
          };
        },
        { name: rel.relationshipName, values: [], isModified: false },
      );

      return fieldDiff;
    })
    .filter(
      (
        fieldDiff,
      ): fieldDiff is {
        name: string;
        values: never[];
        isModified: boolean;
      } => Boolean(fieldDiff && fieldDiff.isModified),
    );

  const unmodifiedRelationships = commonRelationships.filter(
    (rel) =>
      !modifiedRelationships.find(({ name }) => name === rel.relationshipName),
  );

  const isEqual =
    addedRelationships.length === 0 &&
    removedRelationships.length === 0 &&
    modifiedRelationships.length === 0 &&
    unmodifiedRelationships.length === commonRelationships.length;

  return {
    added: addedRelationships,
    removed: removedRelationships,
    modified: modifiedRelationships,
    unmodified: unmodifiedRelationships,
    isEqual,
  };
};

const diffObjectMetas = (
  baseObjectMeta: SkylarkObjectMeta,
  updatedObjectMeta: SkylarkObjectMeta,
): {
  fields: SkylarkSchemaComparisonObjectTypeFieldsDiff;
  relationships: SkylarkSchemaComparisonObjectTypeRelationshipsDiff;
  isEqual: boolean;
} => {
  const fieldDiff = diffObjectMetasFields(
    baseObjectMeta.fields,
    updatedObjectMeta.fields,
  );

  const relationshipDiff = diffObjectMetasRelationships(
    baseObjectMeta.relationships,
    updatedObjectMeta.relationships,
  );

  return {
    fields: fieldDiff,
    relationships: relationshipDiff,
    isEqual: fieldDiff.isEqual && relationshipDiff.isEqual,
  };
};

export const compareSkylarkSchemas = (
  baseSchema: SkylarkObjectMeta[],
  updatedSchema: SkylarkObjectMeta[],
): SkylarkSchemaComparison => {
  // Calculate added and removed Object Types
  const baseSchemaObjectTypes = baseSchema.map(({ name }) => name);
  const updatedSchemaObjectTypes = updatedSchema.map(({ name }) => name);

  const addedObjectTypes = updatedSchemaObjectTypes.filter(
    (objectType) => !baseSchemaObjectTypes.includes(objectType),
  );
  const removedObjectTypes = baseSchemaObjectTypes.filter(
    (objectType) => !updatedSchemaObjectTypes.includes(objectType),
  );

  // If Object Types have been added or removed, we don't need to calculate removed/added fields or relationships so ignore them
  const objectTypesToIgnore = [...addedObjectTypes, ...removedObjectTypes];

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
        objectType,
        ...diffObjectMetas(baseSchemaObjectType, updatedSchemaObjectType),
      };
    })
    .filter((entry): entry is SkylarkSchemaComparisonObjectTypeDiff =>
      Boolean(entry),
    );

  const modifiedObjectTypes = commonObjectTypesDiffs.filter(
    ({ isEqual }) => !isEqual,
  );

  const unmodifiedObjectTypes = commonObjectTypesDiffs.filter(
    ({ objectType }) =>
      !modifiedObjectTypes.find(
        (modified) => objectType === modified.objectType,
      ),
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
