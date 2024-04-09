import {
  IDeveloperField,
  IValidatorField,
  IDeveloperSettings,
} from "dromo-uploader-react";
import { sentenceCase } from "sentence-case";

import { INPUT_REGEX } from "src/constants/skylark";
import {
  BuiltInSkylarkObjectType,
  NormalizedObjectField,
  ParsedSkylarkDimensionsWithValues,
  SkylarkObjectMeta,
  SkylarkSystemField,
} from "src/interfaces/skylark";

export interface DromoSchema {
  fields: IDeveloperField[];
  settings: IDeveloperSettings;
}

const convertObjectInputFieldToDromoField = (
  field: NormalizedObjectField,
): IDeveloperField => {
  const isRequiredValidator: IValidatorField = {
    validate: "required",
    errorMessage: "",
    level: "error",
  };

  const isUniqueValidator: IValidatorField = {
    validate: "unique_case_insensitive",
    level: "error",
  };

  const defaultValidators: IDeveloperField["validators"] = [];

  if (field.isRequired) {
    defaultValidators.push(isRequiredValidator);
  }

  // Ensure all External IDs are unique
  if (field.name === SkylarkSystemField.ExternalID) {
    defaultValidators.push({
      ...isUniqueValidator,
      errorMessage: "External ID must be unique across all object types",
    });
  }

  const defaults = {
    label: field.name,
    key: field.name,
    requireMapping: field.isRequired,
    validators: defaultValidators,
  } satisfies Pick<
    IDeveloperField,
    "label" | "key" | "requireMapping" | "validators"
  >;

  if (field.type === "enum") {
    const enumValues = field.enumValues || [];
    return {
      ...defaults,
      type: "select",
      selectOptions: enumValues.map((value) => ({ label: value, value })),
    };
  }

  switch (field.type) {
    case "int":
      return {
        ...defaults,
        type: ["number", { preset: "integer" }],
      };

    case "float":
      return {
        ...defaults,
        type: "number",
      };

    case "boolean":
      return {
        ...defaults,
        type: "checkbox",
      };

    case "email":
      return {
        ...defaults,
        type: "email",
      };

    case "date":
      return {
        ...defaults,
        type: "date",
      };

    case "datetime":
      return {
        ...defaults,
        type: "datetime",
      };

    case "time":
      return {
        ...defaults,
        type: "time",
      };

    case "url":
      return {
        ...defaults,
        type: "string",
        validators: [
          ...defaults.validators,
          {
            validate: "regex_match",
            regex: INPUT_REGEX.url,
            regexOptions: {
              // Equivalent to "is", Flatfile used to be "isg"
              ignoreCase: true,
              dotAll: true,
            },
            level: "error",
            errorMessage: "Invalid URL",
          },
        ],
      };

    case "ipaddress":
      return {
        ...defaults,
        type: "string",
        validators: [
          ...defaults.validators,
          {
            validate: "regex_match",
            regex: INPUT_REGEX.ipaddress,
            regexOptions: {
              // Equivalent to "is", Flatfile used to be "isg"
              ignoreCase: true,
              dotAll: true,
            },
            level: "error",
            errorMessage: "Invalid IP Address",
          },
        ],
      };

    // case "phone":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     format: "phone",
    //   } as FlatfileTemplatePropertyPhone;

    default:
      return {
        ...defaults,
        type: "string",
      };
  }
};

export const convertObjectMetaToDromoSchemaFields = (
  objectMeta: SkylarkObjectMeta,
): DromoSchema["fields"] => {
  const { inputs } = objectMeta.operations.create;
  const fields = inputs.map(convertObjectInputFieldToDromoField);

  // Add relationships and availability fields
  const relationshipFields = objectMeta.relationships.map(
    ({ relationshipName, objectType }) => {
      const field: DromoSchema["fields"][0] = {
        label: sentenceCase(relationshipName),
        key: relationshipName,
        alternateMatches: [objectType],
        manyToOne: true,
        type: "select",
        selectOptions: [],
      };

      return field;
    },
  );

  fields.push(...relationshipFields);

  if (objectMeta.availability) {
    const field: DromoSchema["fields"][0] = {
      label: "Availability",
      key: "availability",
      manyToOne: true,
      type: "select",
      selectOptions: [],
    };
    fields.push(field);
  }

  return fields;
};

export const convertAvailabilityObjectMetaToDromoSchemaFields = (
  objectMeta: SkylarkObjectMeta,
  availabilityDimensionsWithValues: ParsedSkylarkDimensionsWithValues[],
): DromoSchema["fields"] => {
  const fields = convertObjectMetaToDromoSchemaFields(objectMeta);

  const dimensionFields = availabilityDimensionsWithValues.map(
    ({ title, slug, external_id, uid, values }) => {
      const alternateMatches = [title, slug, external_id, uid].filter(
        (str): str is string => Boolean(str),
      );

      const field: DromoSchema["fields"][0] = {
        label: alternateMatches[0],
        key: uid,
        alternateMatches,
        manyToOne: true,
        type: "select",
        selectOptions: values.map((val) => {
          const alternateValueMatches = [
            val.title,
            val.slug,
            val.external_id,
            val.uid,
          ].filter((str): str is string => Boolean(str));

          return {
            label: alternateValueMatches[0],
            value: val.uid,
            alternateValueMatches,
          };
        }),
      };

      return field;
    },
  );

  return [...fields, ...dimensionFields];
};
