import {
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";

interface ModifiedObjectRelationship {
  relationshipName: string;
  baseObjectType: string;
  updatedObjectType: string;
  isModified: boolean;
}

interface ComparedObjectField {
  name: string;
  baseValue: NormalizedObjectField | null;
  updatedValue: NormalizedObjectField | null;
  type: "equal" | "added" | "removed" | "modified";
  modifiedProperties?: string[];
}

export interface SkylarkSchemaComparisonModifiedObjectType {
  name: string;
  fields: ComparedObjectField[];
  fieldsIsEqual: boolean;
  relationships: {
    added: SkylarkObjectRelationship[];
    removed: SkylarkObjectRelationship[];
    unmodified: SkylarkObjectRelationship[];
    modified: ModifiedObjectRelationship[];
    isEqual: boolean;
  };
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
): {
  isEqual: boolean;
  fields: SkylarkSchemaComparisonModifiedObjectType["fields"];
} => {
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

  const isEqual =
    addedFields.length === 0 &&
    removedFields.length === 0 &&
    comparedFields.filter(({ type }) => type === "modified").length === 0;

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
  };
};

const diffObjectMetasRelationships = (
  baseRelationships: SkylarkObjectRelationship[],
  updatedRelationships: SkylarkObjectRelationship[],
): SkylarkSchemaComparisonModifiedObjectType["relationships"] => {
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
  const modifiedRelationships: ModifiedObjectRelationship[] =
    commonRelationships
      .map((rel): ModifiedObjectRelationship | null => {
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

        return {
          relationshipName: rel.relationshipName,
          baseObjectType: baseRel.objectType,
          updatedObjectType: updatedRel.objectType,
          isModified: baseRel.objectType !== updatedRel.objectType,
        };
      })
      .filter((relDiff): relDiff is ModifiedObjectRelationship =>
        Boolean(relDiff && relDiff.isModified),
      );

  const unmodifiedRelationships = commonRelationships.filter(
    (rel) =>
      !modifiedRelationships.find(
        ({ relationshipName }) => relationshipName === rel.relationshipName,
      ),
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
) => {
  const { fields, isEqual: fieldsIsEqual } = diffObjectMetasFields(
    baseObjectMeta.fields,
    updatedObjectMeta.fields,
  );

  const relationshipDiff = diffObjectMetasRelationships(
    baseObjectMeta.relationships,
    updatedObjectMeta.relationships,
  );

  return {
    fields,
    fieldsIsEqual,
    relationships: relationshipDiff,
    isEqual: fieldsIsEqual && relationshipDiff.isEqual,
  };
};

export const compareSkylarkSchemas = (
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
      objectTypesToIgnore.includes(name) &&
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
