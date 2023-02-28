import { TEMPLATE_REGEX } from "src/constants/flatfile";
import {
  FlatfileTemplate,
  FlatfileTemplatePropertyBoolean,
  FlatfileTemplatePropertyEmail,
  FlatfileTemplatePropertyEnum,
  FlatfileTemplatePropertyNumber,
  FlatfileTemplatePropertyPhone,
  FlatfileTemplatePropertyString,
} from "src/interfaces/flatfile/template";
import { NormalizedObjectField } from "src/interfaces/skylark";

const convertObjectInputFieldToFlatfileProperty = (
  field: NormalizedObjectField,
) => {
  if (field.type === "enum") {
    const enumValues = field.enumValues || [];
    return {
      label: field?.name,
      type: "string",
      enum: enumValues,
      enumLabel: enumValues,
    } as FlatfileTemplatePropertyEnum;
  }

  switch (field.type) {
    case "int":
    case "float":
      return {
        label: field?.name,
        type: "number",
      } as FlatfileTemplatePropertyNumber;

    case "boolean":
      return {
        label: field?.name,
        type: "boolean",
      } as FlatfileTemplatePropertyBoolean;

    case "phone":
      return {
        label: field?.name,
        type: "string",
        format: "phone",
      } as FlatfileTemplatePropertyPhone;

    case "email":
      return {
        label: field?.name,
        type: "string",
        format: "email",
      } as FlatfileTemplatePropertyEmail;

    case "url":
      return {
        label: field?.name,
        type: "string",
        regexp: {
          pattern: TEMPLATE_REGEX.url,
          flags: "isg",
          ignoreBlanks: true,
        },
      } as FlatfileTemplatePropertyString;

    case "ipaddress":
      return {
        label: field?.name,
        type: "string",
        regexp: {
          pattern: TEMPLATE_REGEX.ipaddress,
          flags: "isg",
          ignoreBlanks: true,
        },
      } as FlatfileTemplatePropertyString;

    default:
      return {
        label: field?.name,
        type: "string",
      } as FlatfileTemplatePropertyString;
  }
};

export const convertObjectInputToFlatfileSchema = (
  inputs: NormalizedObjectField[],
): FlatfileTemplate => {
  const required = inputs
    .filter((input) => input.isRequired)
    .map((input) => input.name);

  const properties = inputs.reduce((previousProperties, input) => {
    const convertedInput = convertObjectInputFieldToFlatfileProperty(input);

    return {
      ...previousProperties,
      [input.name]: convertedInput,
    };
  }, {});

  const schema: FlatfileTemplate = {
    type: "object",
    required,
    unique: [],
    properties,
  };

  return schema;
};
