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
  ParsedSkylarkObject,
  SkylarkGraphQLObjectImage,
} from "src/interfaces/skylark";
import { removeFieldPrefixFromReturnedObject } from "src/lib/graphql/skylark/dynamicQueries";
import { hasProperty, isObject } from "src/lib/utils";

import { getObjectAvailabilityStatus } from "./availability";

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

      return {
        name: input.name,
        type: type,
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
): ParsedSkylarkObject => {
  // TODO split into Language and Global
  const metadata: ParsedSkylarkObject["metadata"] = {
    ...Object.keys(object).reduce((prev, key) => {
      return {
        ...prev,
        ...(!isObject(object[key]) ? { [key]: object[key] } : {}),
      };
    }, {}),
    uid: object.uid,
    external_id: object.external_id || "",
  };
  const availability = parseObjectAvailability(object?.availability);

  const images = hasProperty(object, "images")
    ? parseObjectRelationship<SkylarkGraphQLObjectImage>(object.images)
    : undefined;

  const content = hasProperty(object, "content")
    ? parseObjectContent(object.content)
    : undefined;

  const relationships = Object.keys(object)
    ?.filter((relation) => isObject(object[relation]))
    .map((relation) => {
      const relationship = object[relation] as SkylarkGraphQLObjectRelationship;
      console.log(relationship);
      return relation;
    });

  return (
    object && {
      objectType: object.__typename,
      uid: object.uid,
      config: {
        colour: object._config?.colour,
        primaryField: object._config?.primary_field,
      },
      meta: {
        availableLanguages: object._meta?.available_languages,
      },
      metadata,
      availability,
      images,
      relationships,
      content,
    }
  );
};
