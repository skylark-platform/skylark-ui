import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  IntrospectionEnumType,
  IntrospectionField,
  IntrospectionInputType,
  IntrospectionInputValue,
  IntrospectionListTypeRef,
  IntrospectionNamedTypeRef,
  IntrospectionNonNullTypeRef,
  IntrospectionScalarType,
} from "graphql";
import { EnumType } from "json-to-graphql-query";
import { HTMLInputTypeAttribute } from "react";

import { SYSTEM_FIELDS } from "src/constants/skylark";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  NormalizedObjectFieldType,
  NormalizedObjectField,
  ParsedSkylarkObjectAvailability,
  SkylarkGraphQLObjectRelationship,
  SkylarkGraphQLObjectContent,
  ParsedSkylarkObjectContent,
  ParsedSkylarkObjectMetadata,
  SkylarkObjectRelationship,
  SkylarkGraphQLObject,
  ParsedSkylarkObjectImageRelationship,
  SkylarkObjectMeta,
  ParsedSkylarkObject,
  SkylarkGraphQLObjectImage,
  SkylarkObjectMetadataField,
  ParsedSkylarkObjectRelationships,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObjectConfig,
  SkylarkGraphQLObjectConfig,
  SkylarkObjectType,
  SkylarkAvailabilityField,
  ParsedSkylarkObjectConfigFieldConfig,
} from "src/interfaces/skylark";
import { removeFieldPrefixFromReturnedObject } from "src/lib/graphql/skylark/dynamicQueries";
import {
  convertFieldTypeToHTMLInputType,
  hasProperty,
  isObject,
} from "src/lib/utils";

import {
  getObjectAvailabilityStatus,
  getAvailabilityStatusForAvailabilityObject,
  convertToUTCDate,
} from "./availability";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

const parseObjectInputType = (
  name?: GQLScalars | string | null,
): NormalizedObjectFieldType => {
  if (!name) return "string";
  switch (name) {
    case "AWSTimestamp":
      return "timestamp";
    case "AWSTime":
      return "time";
    case "AWSDate":
      return "date";
    case "AWSDateTime":
      return "datetime";
    case "AWSEmail":
      return "email";
    case "AWSURL":
      return "url";
    case "AWSPhone":
      return "phone";
    case "AWSIPAddress":
      return "ipaddress";
    case "AWSJSON":
      return "json";
    case "Int":
      return "int";
    case "Float":
      return "float";
    case "Boolean":
      return "boolean";
    case "String":
    default:
      return "string";
  }
};

export const parseObjectInputFields = (
  objectType: SkylarkObjectType,
  introspectionFields: readonly (
    | IntrospectionField
    | IntrospectionInputValue
  )[],
  enums: Record<string, IntrospectionEnumType>,
): NormalizedObjectField[] => {
  if (!introspectionFields) {
    return [];
  }

  const typesToIgnore = ["INPUT_OBJECT", "OBJECT"];

  const parsedInputs = introspectionFields
    ?.filter(({ type }) => type.kind && !typesToIgnore.includes(type.kind))
    .map((input): NormalizedObjectField => {
      const typeName =
        (
          input.type as
            | IntrospectionNonNullTypeRef<IntrospectionScalarType>
            | IntrospectionListTypeRef<IntrospectionScalarType>
        ).ofType?.name || (input.type as IntrospectionScalarType).name;

      const kind =
        (input.type as IntrospectionNonNullTypeRef | IntrospectionListTypeRef)
          .ofType?.kind || input.type.kind;

      let type: NormalizedObjectFieldType = parseObjectInputType(typeName);
      let enumValues;

      if (kind === "ENUM") {
        type = "enum";
        enumValues = hasProperty(enums, typeName)
          ? enums[typeName].enumValues.map(({ name }) => name)
          : [];
      }

      return {
        name: input.name,
        type: type,
        originalType: (typeName || "Unknown") as GQLScalars,
        enumValues,
        isList: input.type.kind === "LIST",
        isRequired: input.type.kind === "NON_NULL",
      };
    });

  // TODO TIMEZONE - enable after fixing datetime-local input
  // // Override for the Availability Timezone input
  // if (
  //   objectType === BuiltInSkylarkObjectType.Availability &&
  //   parsedInputs.findIndex(
  //     ({ name }) => name === SkylarkAvailabilityField.Timezone,
  //   ) === -1
  // ) {
  //   return [
  //     ...parsedInputs,
  //     {
  //       name: SkylarkAvailabilityField.Timezone,
  //       type: "string",
  //       originalType: "String",
  //       isList: false,
  //       isRequired: false,
  //     },
  //   ];
  // }

  return parsedInputs;
};

export const parseObjectRelationships = (
  relationshipInputFields?: readonly IntrospectionInputValue[],
): SkylarkObjectRelationship[] => {
  if (!relationshipInputFields) {
    return [];
  }

  // Relationship input format is `${objectType}RelationshipInput`, we just need the objectType
  const relationshipInputPostfix = "RelationshipInput";
  const potentialRelationships = relationshipInputFields.map(
    ({ name, type }) => ({
      name,
      objectTypeWithRelationshipInput: (
        type as IntrospectionNamedTypeRef<IntrospectionInputType>
      ).name,
    }),
  );

  const relationships: SkylarkObjectRelationship[] = potentialRelationships
    .filter(
      ({ name, objectTypeWithRelationshipInput }) =>
        name &&
        objectTypeWithRelationshipInput &&
        objectTypeWithRelationshipInput.endsWith(relationshipInputPostfix),
    )
    .map(({ name, objectTypeWithRelationshipInput }) => ({
      relationshipName: name,
      objectType: (objectTypeWithRelationshipInput as string).split(
        relationshipInputPostfix,
      )[0],
    }));

  return relationships;
};

const parseObjectAvailability = (
  unparsedObject?: SkylarkGraphQLObjectRelationship,
): ParsedSkylarkObjectAvailability => {
  const objects = (unparsedObject?.objects ||
    []) as ParsedSkylarkObjectAvailability["objects"];

  return {
    status: getObjectAvailabilityStatus(objects),
    objects,
  };
};

export const parseObjectConfig = (
  objectType: string,
  unparsedConfig?: SkylarkGraphQLObjectConfig,
): ParsedSkylarkObjectConfig => {
  const fieldConfig: ParsedSkylarkObjectConfig["fieldConfig"] =
    unparsedConfig?.field_config
      ?.map(({ name, ui_position, ui_field_type }) => ({
        name,
        position: ui_position,
        fieldType: ui_field_type,
      }))
      .sort((a, b) => a.position - b.position);

  const objectConfig = {
    colour: unparsedConfig?.colour,
    primaryField: unparsedConfig?.primary_field,
    objectTypeDisplayName: unparsedConfig?.display_name,
    fieldConfig,
  };

  // TODO TIMEZONE - enable after fixing datetime-local input
  // // Override for the Availability Timezone input
  // if (fieldConfig && objectType === BuiltInSkylarkObjectType.Availability) {
  //   const timezoneConfig = fieldConfig.find(
  //     ({ name }) => name === SkylarkAvailabilityField.Timezone,
  //   );

  //   if (timezoneConfig) {
  //     // If timezone config is already defined, ensure its the TIMEZONE field type
  //     const updatedFieldConfig = fieldConfig.map(
  //       (config): ParsedSkylarkObjectConfigFieldConfig =>
  //         config.name === SkylarkAvailabilityField.Timezone
  //           ? { ...config, fieldType: "TIMEZONE" }
  //           : config,
  //     );

  //     return {
  //       ...objectConfig,
  //       fieldConfig: updatedFieldConfig,
  //     };
  //   }

  //   return {
  //     ...objectConfig,
  //     fieldConfig: [
  //       ...(objectConfig.fieldConfig || []),
  //       {
  //         name: SkylarkAvailabilityField.Timezone,
  //         fieldType: "TIMEZONE",
  //         position: 50,
  //       },
  //     ],
  //   };
  // }

  return objectConfig;
};

export const parseObjectRelationship = <T>(
  unparsedObject?: SkylarkGraphQLObjectRelationship,
): T[] => {
  if (!unparsedObject) {
    return [];
  }
  return unparsedObject.objects as T[];
};

export const parseObjectContent = (
  unparsedContent?: SkylarkGraphQLObjectContent,
): ParsedSkylarkObjectContent => {
  const normalisedContentObjects = unparsedContent?.objects.map(
    ({ object, position }) => {
      const normalisedObject =
        removeFieldPrefixFromReturnedObject<ParsedSkylarkObjectMetadata>(
          object,
        );
      return {
        objectType: object.__typename,
        position,
        config: parseObjectConfig(object.__typename, object._config),
        meta: {
          language: object._meta?.language_data.language || "",
          availableLanguages: object._meta?.available_languages || [],
          versions: {
            language: object._meta?.language_data.version,
            global: object._meta?.global_data.version,
          },
          availabilityStatus: null,
        },
        object: normalisedObject,
      };
    },
  );

  return {
    objects: normalisedContentObjects || [],
  };
};

export const parseSkylarkObject = (
  object: SkylarkGraphQLObject,
  objectMeta?: SkylarkObjectMeta | null,
): ParsedSkylarkObject => {
  const metadata: ParsedSkylarkObjectMetadata = {
    ...Object.keys(object).reduce((prev, key) => {
      return {
        ...prev,
        ...(!isObject(object[key])
          ? { [key]: object[key] === null ? null : object[key] }
          : {}),
      };
    }, {}),
    uid: object.uid,
    external_id: object.external_id || "",
  };

  const availability = parseObjectAvailability(object?.availability);
  const availabilityStatus =
    object.__typename === BuiltInSkylarkObjectType.Availability
      ? getAvailabilityStatusForAvailabilityObject(metadata)
      : availability.status;

  const images =
    objectMeta?.images?.relationshipNames.map(
      (imageField): ParsedSkylarkObjectImageRelationship => {
        const parsedImages =
          hasProperty(object, imageField) &&
          parseObjectRelationship<SkylarkGraphQLObjectImage>(
            object[imageField] as SkylarkGraphQLObjectRelationship,
          );
        return {
          relationshipName: imageField,
          objects: parsedImages || [],
        };
      },
    ) || [];

  const content = hasProperty(object, "content")
    ? parseObjectContent(object.content)
    : undefined;

  return (
    object && {
      objectType: object.__typename,
      uid: object.uid,
      config: parseObjectConfig(object.__typename, object._config),
      meta: {
        language: object._meta?.language_data.language || "",
        availableLanguages: object._meta?.available_languages || [],
        versions: {
          language: object._meta?.language_data.version,
          global: object._meta?.global_data.version,
        },
        availabilityStatus,
        created: object._meta?.created?.date,
        modified: object._meta?.modified?.date,
      },
      metadata,
      availability,
      images,
      content,
    }
  );
};

const validateAndParseDate = (
  type: string,
  value: string,
  formats?: string[],
  ignoreError?: boolean,
) => {
  const validFormat = formats?.find((format) => dayjs(value, format).isValid());
  if (validFormat) {
    return dayjs(value, validFormat);
  }

  if (!ignoreError && !dayjs(value).isValid()) {
    throw new Error(
      `Value given for ${type} is an invalid format: "${value}"${
        formats ? `. Valid formats: "${formats?.join('", "')}"` : ""
      }`,
    );
  }
  return dayjs(value);
};

export const parseInputFieldValue = (
  value: string | number | boolean | string[],
  type: NormalizedObjectFieldType,
): string | number | boolean | EnumType | string[] | null => {
  if (value === undefined || (value === "" && type !== "string")) {
    return null;
  }
  if (type === "enum") {
    return new EnumType(value as string);
  }
  if (type === "datetime") {
    return validateAndParseDate(type, value as string).toISOString();
  }
  if (type === "date") {
    return validateAndParseDate(type, value as string, [
      "YYYY-MM-DD",
      "YYYY-MM-DDZ",
      "DD/MM/YYYY",
    ]).format("YYYY-MM-DDZ");
  }
  if (type === "time") {
    return validateAndParseDate(type, value as string, [
      "HH:mm:ss",
      "HH:mm",
      "HH:mm:ssZ",
      "HH:mmZ",
    ]).format("HH:mm:ss.SSSZ");
  }
  if (type === "timestamp") {
    return validateAndParseDate(type, value as string, ["X", "x"]).unix();
  }
  if (type === "int") {
    return parseInt(value as string);
  }
  if (type === "float") {
    return parseFloat(value as string);
  }
  if (type === "json") {
    return value;
  }
  if (type === "boolean") {
    return !!value;
  }
  return value;
};

export const parseMetadataForGraphQLRequest = (
  objectType: SkylarkObjectType,
  metadata: Record<string, SkylarkObjectMetadataField>,
  inputFields: NormalizedObjectField[],
) => {
  const keyValuePairs = Object.entries(metadata)
    .map(([key, value]) => {
      const input = inputFields.find((createInput) => createInput.name === key);
      if (!input) {
        return undefined;
      }

      // Empty strings are allowed unless its a system field
      const emptyStringAllowed =
        input.type === "string" && !SYSTEM_FIELDS.includes(key);
      const isInvalidDate =
        ["date", "datetime", "time", "timestamp"].includes(input.type) &&
        value === "Invalid Date";

      if (
        value === null ||
        (value === "" && !emptyStringAllowed) ||
        isInvalidDate
      ) {
        // Empty strings will not work with AWSDateTime, or AWSURL so don't send them
        return undefined;
      }

      const parsedFieldValue = parseInputFieldValue(value, input.type);

      // TODO TIMEZONE - enable after fixing datetime-local input
      // if (objectType === BuiltInSkylarkObjectType.Availability) {
      //   // Never send the Timezone field that we add manually
      //   if (input.name === SkylarkAvailabilityField.Timezone) {
      //     return undefined;
      //   }

      //   // Append Timezone onto Availability Start and End values
      //   if (
      //     typeof parsedFieldValue === "string" &&
      //     hasProperty(metadata, SkylarkAvailabilityField.Timezone) &&
      //     (input.name === SkylarkAvailabilityField.Start ||
      //       input.name === SkylarkAvailabilityField.End)
      //   ) {
      //     console.log({ input, metadata, parsedFieldValue });
      //     const parsedDateFieldWithTimezone = convertToUTCDate(
      //       parsedFieldValue,
      //       metadata.timezone as string,
      //     );
      //     console.log({ parsedDateFieldWithTimezone });
      //     return [key, parsedDateFieldWithTimezone];
      //   }
      // }

      // If parsedFieldValue is returned as invalid, return the original value - GraphQL will handle the error
      return [key, parsedFieldValue || value];
    })
    .filter((value) => value !== undefined) as [string, string | EnumType][];

  const parsedMetadata = Object.fromEntries(keyValuePairs);
  return parsedMetadata;
};

export const parseDateTimeForHTMLForm = (
  type: HTMLInputTypeAttribute,
  value: SkylarkObjectMetadataField,
) => {
  if (type === "datetime-local") {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
    const validDateTimeLocal = dayjs(`${value}`).format(
      "YYYY-MM-DDTHH:mm:ss.SSS",
    );
    return validDateTimeLocal;
  }

  if (type === "date") {
    const validDate = validateAndParseDate(
      type,
      `${value}`,
      ["YYYY-MM-DD", "YYYY-MM-DD+Z"],
      true,
    ).format("YYYY-MM-DD");
    return validDate;
  }

  if (type === "time") {
    const validTime = validateAndParseDate(
      type,
      `${value}`,
      ["HH:mm:ss", "HH:mm:ss.SSS", "HH:mm:ss.SSS+Z"],
      true,
    ).format("HH:mm:ss.SSS");
    return validTime;
  }
};

// Parses an object's metadata so it works with a HTML Form Input
export const parseMetadataForHTMLForm = (
  metadata: Record<string, SkylarkObjectMetadataField>,
  inputFields: NormalizedObjectField[],
): Record<string, SkylarkObjectMetadataField> => {
  const keyValuePairs = Object.entries(metadata).map(([key, value]) => {
    const input = inputFields.find((createInput) => createInput.name === key);
    if (input) {
      const htmlInputType = convertFieldTypeToHTMLInputType(input.type);

      if (["datetime-local", "date", "time"].includes(htmlInputType)) {
        return [key, parseDateTimeForHTMLForm(htmlInputType, value)];
      }
    }

    return [key, value === null ? "" : value];
  });
  const parsedMetadata: Record<string, SkylarkObjectMetadataField> =
    Object.fromEntries(keyValuePairs);
  return parsedMetadata;
};

export const parseUpdatedRelationshipObjects = (
  relationship: SkylarkObjectRelationship,
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[],
  originalRelationshipObjects: ParsedSkylarkObjectRelationships[],
) => {
  const updatedObjects: string[] =
    updatedRelationshipObjects
      .find(
        ({ relationshipName }) =>
          relationshipName === relationship?.relationshipName,
      )
      ?.objects.map(({ uid }) => uid) || [];

  const originalObjects =
    originalRelationshipObjects.find(
      ({ relationshipName }) =>
        relationshipName === relationship?.relationshipName,
    )?.objects || [];
  const originalUids = originalObjects.map(({ uid }) => uid);

  const uidsToLink = updatedObjects.filter(
    (uid) => !originalUids.includes(uid),
  );
  const uidsToUnlink = originalUids.filter(
    (uid) => !updatedObjects.includes(uid),
  );

  return { relationship, uidsToLink, uidsToUnlink };
};
