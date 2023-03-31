import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { EnumType } from "json-to-graphql-query";

import {
  GQLInputField,
  GQLScalars,
} from "src/interfaces/graphql/introspection";
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
} from "src/interfaces/skylark";
import { removeFieldPrefixFromReturnedObject } from "src/lib/graphql/skylark/dynamicQueries";
import {
  convertFieldTypeToHTMLInputType,
  hasProperty,
  isObject,
} from "src/lib/utils";

import { getObjectAvailabilityStatus } from "./availability";

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
  inputFields?: GQLInputField[],
): NormalizedObjectField[] => {
  if (!inputFields) {
    return [];
  }

  // We handle relationships and availability separately
  // TODO uses more than name strings to ignore these (incase the user has a name clash)
  const inputsToIgnore = ["relationships", "availability"];

  const parsedInputs = inputFields
    .filter(({ name }) => !inputsToIgnore.includes(name))
    .map((input): NormalizedObjectField => {
      let type: NormalizedObjectFieldType = parseObjectInputType(
        input.type.ofType?.name || input.type.name,
      );
      let enumValues;

      if (input.type.kind === "ENUM") {
        type = "enum";
        enumValues = input.type.enumValues?.map((val) => val.name);
      }

      if (input.name === "requiredstring") console.log(input);

      return {
        name: input.name,
        type: type,
        originalType: input.type.ofType?.name || input.type.name || "Unknown",
        enumValues,
        isList: input.type.kind === "LIST",
        isRequired: input.type.kind === "NON_NULL",
      };
    });

  return parsedInputs;
};

// TODO convert from "credits" to the Object type like "Credit" or "episodes" -> "Episode"
export const parseObjectRelationships = (
  inputFields?: GQLInputField[],
): SkylarkObjectRelationship[] => {
  const relationshipsInput = inputFields?.find(
    (input) => input.name === "relationships",
  );

  if (
    !relationshipsInput?.type.inputFields ||
    relationshipsInput.type.inputFields.length === 0
  ) {
    return [];
  }

  // Relationship input format is `${objectType}RelationshipInput`, we just need the objectType
  const relationshipInputPostfix = "RelationshipInput";
  const potentialRelationships = relationshipsInput.type.inputFields.map(
    ({ name, type: { name: objectTypeWithRelationshipInput } }) => ({
      name,
      objectTypeWithRelationshipInput,
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

export const parseObjectAvailability = (
  unparsedObject?: SkylarkGraphQLObjectRelationship,
): ParsedSkylarkObjectAvailability => {
  const objects = (unparsedObject?.objects ||
    []) as ParsedSkylarkObjectAvailability["objects"];

  return {
    status: getObjectAvailabilityStatus(objects),
    objects,
  };
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
        config: {
          primaryField: object._config?.primary_field,
          colour: object._config?.colour,
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
  // TODO split into Language and Global
  const metadata: ParsedSkylarkObject["metadata"] = {
    ...Object.keys(object).reduce((prev, key) => {
      return {
        ...prev,
        ...(!isObject(object[key])
          ? { [key]: object[key] === null ? "" : object[key] }
          : {}),
      };
    }, {}),
    uid: object.uid,
    external_id: object.external_id || "",
  };
  const availability = parseObjectAvailability(object?.availability);

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
      config: {
        colour: object._config?.colour,
        primaryField: object._config?.primary_field,
      },
      meta: {
        language: object._meta?.language_data.language || "",
        availableLanguages: object._meta?.available_languages || [],
        versions: {
          language: object._meta?.language_data.version,
          global: object._meta?.global_data.version,
        },
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
) => {
  const validFormat = formats?.find((format) => dayjs(value, format).isValid());
  if (validFormat) {
    return dayjs(value, validFormat);
  }

  if (!dayjs(value).isValid()) {
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
  if (value === "") {
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
  return value;
};

export const parseMetadataForGraphQLRequest = (
  metadata: Record<string, SkylarkObjectMetadataField>,
  inputFields: NormalizedObjectField[],
) => {
  const keyValuePairs = Object.entries(metadata)
    .map(([key, value]) => {
      if (value === null || value === "") {
        // Empty strings will not work with AWSDateTime, or AWSURL so don't send them
        return null;
      }

      const input = inputFields.find((createInput) => createInput.name === key);
      if (!input) {
        return null;
      }

      const parsedFieldValue = parseInputFieldValue(value, input.type);
      return [key, parsedFieldValue];
    })
    .filter((value) => value !== null) as [string, string | EnumType][];

  const parsedMetadata = Object.fromEntries(keyValuePairs);
  return parsedMetadata;
};

export const parseMetadataForHTMLForm = (
  metadata: Record<string, SkylarkObjectMetadataField>,
  inputFields: NormalizedObjectField[],
) => {
  const keyValuePairs = Object.entries(metadata).map(([key, value]) => {
    const input = inputFields.find((createInput) => createInput.name === key);
    if (
      input &&
      convertFieldTypeToHTMLInputType(input.type) === "datetime-local"
    ) {
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
      const validDateTimeLocal = dayjs(`${value}`).format(
        "YYYY-MM-DDTHH:mm:ss.SSS",
      );
      console.log("converting", key, value, validDateTimeLocal);
      return [key, validDateTimeLocal];
    }

    return [key, value];
  });
  const parsedMetadata: Record<string, SkylarkObjectMetadataField> =
    Object.fromEntries(keyValuePairs);
  return parsedMetadata;
};
