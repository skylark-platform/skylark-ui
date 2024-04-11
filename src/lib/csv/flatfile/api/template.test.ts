import { graphql } from "msw";

import {
  erroredFlatfileTemplateSearch,
  mockFlatfileUpdatedTemplate,
} from "src/__tests__/mocks/handlers/flatfile";
import { server } from "src/__tests__/mocks/server";
import { FlatfileGetTemplatesResponse } from "src/interfaces/flatfile/responses";
import { FlatfileTemplate } from "src/interfaces/flatfile/template";
import {
  createFlatfileClient,
  FlatfileClient,
} from "src/lib/graphql/flatfile/client";

import {
  createOrUpdateFlatfileTemplate,
  validateRequestTemplate,
} from "./template";

const template: FlatfileTemplate = {
  type: "object",
  required: [],
  unique: [],
  properties: {
    title: {
      type: "string",
      label: "Title",
    },
  },
};

describe("validateRequestTemplate", () => {
  test("does not error when the template is valid", () => {
    expect(() => validateRequestTemplate(template)).not.toThrow("");
  });

  test("errors when a required key is not given", () => {
    const invalidTemplate = {
      type: "",
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: required schema properties are "type", "properties"',
    );
  });

  test("errors when an unknown key is given", () => {
    const invalidTemplate = {
      type: "object",
      properties: {},
      unknownKey: true,
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: valid schema properties are "type", "properties", "required", "unique"',
    );
  });

  test("errors when the required property is given but it is not an array", () => {
    const invalidTemplate = {
      type: "object",
      properties: {},
      required: 123,
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: property "required" should be an array',
    );
  });

  test("errors when the unique property is given but it is not an array", () => {
    const invalidTemplate = {
      type: "object",
      properties: {},
      unique: "string",
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: property "unique" should be an array',
    );
  });

  test("errors when the type property not a string", () => {
    const invalidTemplate = {
      type: 123,
      properties: {},
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: property "type" should be a string',
    );
  });

  test("errors when the properties property not an object", () => {
    const invalidTemplate = {
      type: "object",
      properties: "string",
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: property "properties" should be an object',
    );
  });

  test("errors when the properties property is an empty object", () => {
    const invalidTemplate = {
      type: "object",
      properties: {},
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: property "properties" should not be an empty object',
    );
  });

  test("errors when the a key in the properties property does not have a label or title", () => {
    const invalidTemplate = {
      type: "object",
      properties: {
        title: {},
      },
    };
    expect(() => validateRequestTemplate(invalidTemplate)).toThrow(
      'Schema error: property "properties" each value should be an object with required properties "label" and "type"',
    );
  });
});

describe("createOrUpdateFlatfileTemplate", () => {
  const templateName = "templateName";

  let flatfileClient: FlatfileClient;

  beforeEach(() => {
    flatfileClient = createFlatfileClient("token");
  });

  test("makes a create request when a Portal is not found in Flatfile", async () => {
    server.use(
      graphql.query("GET_TEMPLATES", (req, res, ctx) => {
        const data: FlatfileGetTemplatesResponse = {
          getSchemas: {
            data: [],
          },
        };
        return res(ctx.data(data));
      }),
    );

    const got = await createOrUpdateFlatfileTemplate(
      flatfileClient,
      templateName,
      template,
    );

    expect(got).toEqual({
      id: "created-template",
      name: "Created Template 1",
    });
  });

  test("makes an update request when a Portal is found in Flatfile", async () => {
    const got = await createOrUpdateFlatfileTemplate(
      flatfileClient,
      templateName,
      template,
    );

    expect(got).toEqual(mockFlatfileUpdatedTemplate);
  });

  test("throws an error when a Flatfile request fails", async () => {
    server.use(erroredFlatfileTemplateSearch);

    await expect(
      createOrUpdateFlatfileTemplate(flatfileClient, templateName, template),
    ).rejects.toThrow("Error fetching templates");
  });
});
