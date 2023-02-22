import {
  FlatfileGetTemplatesResponse,
  FlatfileUpdateTemplateResponse,
  FlatfileCreateTemplateResponse,
} from "src/interfaces/flatfile/responses";
import { FlatfileTemplate } from "src/interfaces/flatfile/template";
import { FlatfileClient } from "src/lib/graphql/flatfile/client";
import "src/lib/graphql/flatfile/mutations";
import {
  CREATE_TEMPLATE,
  UPDATE_TEMPLATE,
} from "src/lib/graphql/flatfile/mutations";
import "src/lib/graphql/flatfile/queries";
import { GET_TEMPLATES } from "src/lib/graphql/flatfile/queries";
import { hasProperty, isObject } from "src/lib/utils";

export const validateRequestTemplate = (schema: object) => {
  const requiredProperties = ["type", "properties"];
  const optionalProperties = ["required", "unique"];
  const validProperties = [...requiredProperties, ...optionalProperties];

  const allRequiredKeysFound =
    Object.keys(schema).length > 0 &&
    requiredProperties.every((key) => Object.keys(schema).includes(key));
  if (!allRequiredKeysFound) {
    throw new Error(
      `Schema error: required schema properties are "${requiredProperties.join(
        '", "',
      )}"`,
    );
  }

  const validKeys =
    Object.keys(schema).length > 0 &&
    Object.keys(schema).every((key) => validProperties.includes(key));
  if (!validKeys) {
    throw new Error(
      `Schema error: valid schema properties are "${validProperties.join(
        '", "',
      )}"`,
    );
  }

  if (hasProperty(schema, "required") && !Array.isArray(schema.required)) {
    throw new Error(`Schema error: property "required" should be an array`);
  }

  if (hasProperty(schema, "unique") && !Array.isArray(schema.unique)) {
    throw new Error(`Schema error: property "unique" should be an array`);
  }

  if (
    hasProperty(schema, "type") &&
    !(typeof schema.type === "string" || schema.type instanceof String)
  ) {
    throw new Error(`Schema error: property "type" should be a string`);
  }

  if (hasProperty(schema, "properties")) {
    if (!isObject(schema.properties)) {
      throw new Error(
        `Schema error: property "properties" should be an object`,
      );
    }

    if (Object.keys(schema.properties).length === 0) {
      throw new Error(
        `Schema error: property "properties" should not be an empty object`,
      );
    }

    const allPropertiesHaveRequiredFields = Object.values(
      schema.properties,
    ).every(
      (value) =>
        isObject(value) &&
        hasProperty(value, "label") &&
        hasProperty(value, "type"),
    );
    if (!allPropertiesHaveRequiredFields) {
      throw new Error(
        `Schema error: property "properties" each value should be an object with required properties "label" and "type"`,
      );
    }
  }
};

export const createOrUpdateFlatfileTemplate = async (
  client: FlatfileClient,
  name: string,
  schema: FlatfileTemplate,
) => {
  const getTemplatesResponse =
    await client.request<FlatfileGetTemplatesResponse>(GET_TEMPLATES, {
      searchQuery: name,
    });
  console.log({ getTemplatesResponse });

  const foundTemplates = getTemplatesResponse.getSchemas.data;

  if (foundTemplates.length > 0) {
    const [existingTemplate] = foundTemplates;

    const updateResponse = await client.request<FlatfileUpdateTemplateResponse>(
      UPDATE_TEMPLATE,
      {
        schemaId: existingTemplate.id,
        schema: {
          schema,
        },
      },
    );
    return updateResponse.updateSchema;
  }

  const createResponse = await client.request<FlatfileCreateTemplateResponse>(
    CREATE_TEMPLATE,
    {
      name,
      schema: {
        schema,
      },
    },
  );
  return createResponse.createSchema;
};
