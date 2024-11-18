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

import { UTC_NAME } from "src/components/inputs/select";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  NormalizedObjectFieldType,
  NormalizedObjectField,
  ParsedSkylarkObjectAvailability,
  SkylarkGraphQLObjectContent,
  SkylarkObjectContent,
  ParsedSkylarkObjectMetadata,
  SkylarkObjectMetaRelationship,
  SkylarkGraphQLObject,
  SkylarkObjectMeta,
  ParsedSkylarkObject,
  SkylarkGraphQLObjectImage,
  SkylarkObjectMetadataField,
  SkylarkObjectRelationships,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObjectConfig,
  SkylarkGraphQLObjectConfig,
  SkylarkObjectType,
  SkylarkAvailabilityField,
  ParsedSkylarkObjectConfigFieldConfig,
  SkylarkSystemField,
  SkylarkGraphQLObjectMeta,
  AvailabilityStatus,
  SkylarkGraphQLObjectList,
  ParsedSkylarkObjectMeta,
  SkylarkGraphQLAvailability,
  ParsedSkylarkObjectAvailabilityObject,
  SkylarkGraphQLAvailabilityList,
  SkylarkObjectImageRelationship,
  SkylarkGraphQLDynamicContentConfiguration,
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
  convertDateAndTimezoneToISO,
  AWS_EARLIEST_DATE,
  AWS_LATEST_DATE,
  convertDateToTimezoneAndRemoveOffset,
  convertTimeWindowStatus,
} from "./availability";
import { convertParsedObjectToIdentifier } from "./objects";

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

export const VALID_DATE_FORMATS = ["YYYY-MM-DD", "YYYY-MM-DDZ", "DD/MM/YYYY"];

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

  return parsedInputs;
};

export const parseObjectRelationships = (
  relationshipInputFields?: readonly IntrospectionInputValue[],
): SkylarkObjectMetaRelationship[] => {
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

  const relationships: SkylarkObjectMetaRelationship[] = potentialRelationships
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

export const parseAvailabilityObjects = (
  objects?: SkylarkGraphQLAvailability[],
): ParsedSkylarkObjectAvailabilityObject[] => {
  return objects
    ? objects.map((object) => {
        return {
          ...object,
          title: object.title,
          slug: object.slug,
          start: object.start,
          end: object.end,
          timezone: object.timezone,
          active: object.active === false ? false : true,
          inherited: object.inherited || false,
          inheritanceSource: object.inheritance_source || false,
          dimensions: object?.dimensions?.objects || [],
        };
      })
    : [];
};

const parseObjectAvailability = (
  unparsedObject?: SkylarkGraphQLAvailabilityList,
): ParsedSkylarkObjectAvailability => {
  const objects = parseAvailabilityObjects(unparsedObject?.objects);

  const status = unparsedObject?.time_window_status
    ? convertTimeWindowStatus(unparsedObject?.time_window_status)
    : getObjectAvailabilityStatus(objects);

  return {
    status,
    objects,
  };
};

const parseObjectMeta = (
  meta: SkylarkGraphQLObjectMeta | undefined,
  availabilityStatus: AvailabilityStatus | null,
  dynamicContentConfiguration?: SkylarkGraphQLDynamicContentConfiguration,
): ParsedSkylarkObjectMeta => ({
  availabilityStatus,
  language: meta?.language_data.language || "",
  availableLanguages: meta?.available_languages || [],
  versions: {
    language: meta?.language_data.version,
    global: meta?.global_data.version,
  },
  created: meta?.created?.date,
  modified: meta?.modified?.date,
  published: meta?.published,
  hasDynamicContent: Boolean(
    dynamicContentConfiguration?.dynamic_content_types &&
      dynamicContentConfiguration?.dynamic_content_types.length > 0,
  ),
});

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

  // Override for the Availability Timezone input
  if (fieldConfig && objectType === BuiltInSkylarkObjectType.Availability) {
    const timezoneConfig = fieldConfig.find(
      ({ name }) => name === SkylarkAvailabilityField.Timezone,
    );

    if (timezoneConfig) {
      // If timezone config is already defined, ensure its the TIMEZONE field type
      const updatedFieldConfig = fieldConfig.map(
        (config): ParsedSkylarkObjectConfigFieldConfig =>
          config.name === SkylarkAvailabilityField.Timezone
            ? { ...config, fieldType: "TIMEZONE" }
            : config,
      );

      return {
        ...objectConfig,
        fieldConfig: updatedFieldConfig,
      };
    }

    return {
      ...objectConfig,
      fieldConfig: [
        ...(objectConfig.fieldConfig || []),
        {
          name: SkylarkAvailabilityField.Timezone,
          fieldType: "TIMEZONE",
          position: 50,
        },
      ],
    };
  }

  return objectConfig;
};

export const parseObjectRelationship = <T>(
  unparsedObject?: SkylarkGraphQLObjectList,
): T[] => {
  if (!unparsedObject) {
    return [];
  }
  return unparsedObject.objects as T[];
};

export const parseObjectContent = (
  unparsedContent?: SkylarkGraphQLObjectContent,
): SkylarkObjectContent => {
  const normalisedContentObjects = unparsedContent?.objects.map(
    ({ object, position, dynamic }) => {
      const normalisedObject =
        removeFieldPrefixFromReturnedObject<ParsedSkylarkObjectMetadata>(
          object,
        );
      const availability = parseObjectAvailability(object?.availability);
      return {
        ...convertParsedObjectToIdentifier({
          uid: normalisedObject.uid,
          objectType: object.__typename,
          metadata: normalisedObject,
          config: parseObjectConfig(object.__typename, object._config),
          meta: parseObjectMeta(object._meta, availability.status),
          availability,
        }),
        position,
        isDynamic: dynamic || false,
      };
    },
  );

  return {
    objects: normalisedContentObjects || [],
  };
};

const parseObjectMetadata = (
  object: SkylarkGraphQLObject,
): ParsedSkylarkObjectMetadata => {
  const metadata: ParsedSkylarkObjectMetadata = {
    type: null,
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

  if (
    object.__typename === BuiltInSkylarkObjectType.Availability &&
    hasProperty(object, SkylarkAvailabilityField.Timezone) &&
    typeof object[SkylarkAvailabilityField.Timezone] === "string"
  ) {
    const start = object[SkylarkAvailabilityField.Start];
    const end = object[SkylarkAvailabilityField.End];
    const timezone = object[SkylarkAvailabilityField.Timezone];

    if (typeof start === "string") {
      metadata[SkylarkAvailabilityField.Start] =
        convertDateToTimezoneAndRemoveOffset(start, timezone);
    }

    if (typeof end === "string") {
      metadata[SkylarkAvailabilityField.End] =
        convertDateToTimezoneAndRemoveOffset(end, timezone);
    }
  }

  return metadata;
};

export const parseSkylarkObject = (
  object: SkylarkGraphQLObject,
  objectMeta?: SkylarkObjectMeta | null,
): ParsedSkylarkObject => {
  const metadata = parseObjectMetadata(object);

  const availability = parseObjectAvailability(object?.availability);
  const availabilityStatus =
    object.__typename === BuiltInSkylarkObjectType.Availability
      ? getAvailabilityStatusForAvailabilityObject(metadata)
      : availability.status;

  const images =
    objectMeta?.builtinObjectRelationships?.images?.relationshipNames.map(
      (imageField): SkylarkObjectImageRelationship => {
        const parsedImages =
          hasProperty(object, imageField) &&
          parseObjectRelationship<SkylarkGraphQLObjectImage>(
            object[imageField] as SkylarkGraphQLObjectList,
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
      meta: parseObjectMeta(
        object._meta,
        availabilityStatus,
        object?.dynamic_content,
      ),
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
  {
    formats,
    ignoreError,
    isTimestamp,
  }: {
    formats?: string[];
    ignoreError?: boolean;
    isTimestamp?: boolean;
  },
) => {
  const validFormat = formats?.find((format) => dayjs(value, format).isValid());
  if (validFormat) {
    return isTimestamp
      ? dayjs(value, validFormat)
      : dayjs.tz(value, validFormat, UTC_NAME);
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
    return validateAndParseDate(type, value as string, {}).toISOString();
  }
  if (type === "date") {
    return validateAndParseDate(type, value as string, {
      formats: VALID_DATE_FORMATS,
    }).format("YYYY-MM-DDZ");
  }
  if (type === "time") {
    return validateAndParseDate(type, value as string, {
      formats: ["HH:mm:ss", "HH:mm", "HH:mm:ssZ", "HH:mmZ"],
    }).format("HH:mm:ss.SSSZ");
  }
  if (type === "timestamp") {
    return validateAndParseDate(type, value as string, {
      formats: ["X"],
      isTimestamp: true,
    }).unix();
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
  isCreate?: boolean,
) => {
  const keyValuePairs = Object.entries(metadata)
    .map(([key, value]) => {
      // Never send UID as it cannot be changed
      if (key === SkylarkSystemField.UID) {
        return undefined;
      }

      // Never send blank ExternalID on create
      if (key === SkylarkSystemField.ExternalID && isCreate && !value) {
        return undefined;
      }

      const input = inputFields.find((createInput) => createInput.name === key);
      if (!input) {
        return undefined;
      }

      const isInvalidDate =
        ["date", "datetime", "time", "timestamp"].includes(input.type) &&
        value === "Invalid Date";

      if (objectType === BuiltInSkylarkObjectType.Availability) {
        if (
          key === SkylarkAvailabilityField.Start &&
          (value === "" || isInvalidDate)
        ) {
          return [key, AWS_EARLIEST_DATE];
        }

        if (
          key === SkylarkAvailabilityField.End &&
          (value === "" || isInvalidDate)
        ) {
          return [key, AWS_LATEST_DATE];
        }
      }

      if (
        value === null ||
        value === undefined ||
        value === "" ||
        isInvalidDate
      ) {
        return [key, null];
      }

      const parsedFieldValue = parseInputFieldValue(value, input.type);

      if (objectType === BuiltInSkylarkObjectType.Availability) {
        // Append Timezone onto Availability Start and End values
        if (
          typeof value === "string" &&
          hasProperty(metadata, SkylarkAvailabilityField.Timezone) &&
          (input.name === SkylarkAvailabilityField.Start ||
            input.name === SkylarkAvailabilityField.End)
        ) {
          const parsedDateFieldWithTimezone = convertDateAndTimezoneToISO(
            value,
            metadata.timezone as string,
          );
          return [key, parsedDateFieldWithTimezone];
        }
      }

      const sendParsedFieldValue =
        (input.type === "float" || input.type === "int") &&
        parsedFieldValue === 0;

      // If parsedFieldValue is returned as invalid, return the original value - GraphQL will handle the error
      return [
        key,
        parsedFieldValue || sendParsedFieldValue ? parsedFieldValue : value,
      ];
    })
    .filter((value) => value !== undefined) as [string, string | EnumType][];

  const parsedMetadata = Object.fromEntries(keyValuePairs);
  return parsedMetadata;
};

export const parseDateTimeForHTMLForm = (
  type: HTMLInputTypeAttribute,
  value: SkylarkObjectMetadataField,
) => {
  if (!value) {
    return "";
  }

  if (type === "datetime-local") {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
    const validDateTimeLocal = dayjs(`${value}`).format(
      "YYYY-MM-DDTHH:mm:ss.SSS",
    );
    return validDateTimeLocal;
  }

  if (type === "date") {
    const validDate = validateAndParseDate(type, `${value}`, {
      formats: VALID_DATE_FORMATS,
      ignoreError: true,
    }).format("YYYY-MM-DD");
    return validDate;
  }

  if (type === "time") {
    const validTime = validateAndParseDate(type, `${value}`, {
      formats: ["HH:mm:ss", "HH:mm:ss.SSS", "HH:mm:ss.SSSZ"],
      ignoreError: true,
    }).format("HH:mm:ss.SSS");
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
  relationship: SkylarkObjectMetaRelationship,
  updatedRelationshipObjects: SkylarkObjectRelationships,
  originalRelationshipObjects: SkylarkObjectRelationships,
) => {
  const updatedObjects: string[] =
    updatedRelationshipObjects?.[relationship?.relationshipName]?.objects.map(
      ({ uid }) => uid,
    ) || [];

  const originalObjects =
    originalRelationshipObjects?.[relationship?.relationshipName]?.objects ||
    [];
  const originalUids = originalObjects.map(({ uid }) => uid);

  const uidsToLink = updatedObjects.filter(
    (uid) => !originalUids.includes(uid),
  );
  const uidsToUnlink = originalUids.filter(
    (uid) => !updatedObjects.includes(uid),
  );

  return { relationship, uidsToLink, uidsToUnlink };
};
