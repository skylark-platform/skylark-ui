import {
  IDeveloperField,
  IValidatorField,
  IDeveloperSettings,
} from "dromo-uploader-react";

import { ObjectTypeWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  NormalizedObjectField,
  ParsedSkylarkObject,
  SkylarkObjectRelationship,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";

import { hasProperty } from "../utils";

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

  if (field.name === SkylarkSystemField.ExternalID) {
    defaultValidators.push(isUniqueValidator);
  }

  const defaults: Pick<
    IDeveloperField,
    "label" | "key" | "requireMapping" | "validators"
  > = {
    label: field.name,
    key: field.name,
    requireMapping: field.isRequired,
    validators: defaultValidators,
  };

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

    // case "phone":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     format: "phone",
    //   } as FlatfileTemplatePropertyPhone;

    case "email":
      return {
        ...defaults,
        type: "email",
      };

    // case "url":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     regexp: {
    //       pattern: INPUT_REGEX.url,
    //       flags: "isg",
    //       ignoreBlanks: true,
    //     },
    //   } as FlatfileTemplatePropertyString;

    // case "ipaddress":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     regexp: {
    //       pattern: INPUT_REGEX.ipaddress,
    //       flags: "isg",
    //       ignoreBlanks: true,
    //     },
    //   } as FlatfileTemplatePropertyString;

    // TODO add date, datetime and time

    default:
      return {
        ...defaults,
        type: "string",
      };
  }
};

export const convertObjectInputToDromoSchemaFields = (
  inputs: NormalizedObjectField[],
  relationships: SkylarkObjectRelationship[],
): DromoSchema["fields"] => {
  const required = inputs
    .filter((input) => input.isRequired)
    .map((input) => input.name);

  const fields = inputs.map(convertObjectInputFieldToDromoField);

  return fields;
};

export const convertRelationshipsToDromoSchemaFields = (
  relationships: SkylarkObjectRelationship[],
  allObjects: Record<SkylarkObjectType, ParsedSkylarkObject[]>,
  objectTypesWithConfig: ObjectTypeWithConfig[],
) => {
  return relationships.map(({ relationshipName, objectType }) => {
    const objects = hasProperty(allObjects, objectType)
      ? allObjects[objectType]
      : [];

    const field: DromoSchema["fields"][0] = {
      label: relationshipName,
      key: relationshipName,
      manyToOne: true,
      type: "select",
      selectOptions: objects.map(({ metadata }) => {
        const ot = objectTypesWithConfig.find(
          (o) => o.objectType === objectType,
        );

        const primaryField = ot?.config.primaryField || "external_id";

        return {
          label:
            ((hasProperty(metadata, primaryField) &&
              metadata[primaryField]) as string) ||
            metadata.external_id ||
            metadata.uid,
          value: metadata.uid,
          alternateMatches: Object.values(metadata).filter(
            (field): field is string => typeof field === "string",
          ),
        };
      }),
    };

    return field;
  });
};
