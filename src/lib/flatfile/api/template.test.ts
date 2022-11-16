import { createMockClient, MockApolloClient } from "mock-apollo-client";
import {
  FlatfileCreateTemplateResponse,
  FlatfileGetTemplatesResponse,
  FlatfileUpdateTemplateResponse,
} from "src/interfaces/flatfile/responses";
import { FlatfileTemplate } from "src/interfaces/flatfile/template";
import {
  CREATE_TEMPLATE,
  UPDATE_TEMPLATE,
} from "src/lib/graphql/flatfile/mutations";

import { GET_TEMPLATES } from "../../graphql/flatfile/queries";
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

  const getTemplatesDataEmpty: FlatfileGetTemplatesResponse = {
    getSchemas: {
      data: [],
    },
  };

  const getTemplatesDataFound: FlatfileGetTemplatesResponse = {
    getSchemas: {
      data: [
        {
          id: "template-1",
          name: "Template 1",
        },
      ],
    },
  };

  let mockClient: MockApolloClient;
  let getTemplatesHandler: jest.Mock;
  let createTemplateHandler: jest.Mock;
  let updateTemplateHandler: jest.Mock;

  beforeEach(() => {
    mockClient = createMockClient();

    const createTemplateData: FlatfileCreateTemplateResponse = {
      createSchema: {
        name: "Template 1",
        id: "template-1",
      },
    };
    createTemplateHandler = jest.fn().mockResolvedValue({
      data: createTemplateData,
    });

    const updateTemplateData: FlatfileUpdateTemplateResponse = {
      updateSchema: {
        name: "Template 1",
        id: "template-1",
      },
    };
    updateTemplateHandler = jest.fn().mockResolvedValue({
      data: updateTemplateData,
    });

    mockClient.setRequestHandler(CREATE_TEMPLATE, createTemplateHandler);
    mockClient.setRequestHandler(UPDATE_TEMPLATE, updateTemplateHandler);
  });

  test("makes a request to get all the Portals from Flatfile", async () => {
    getTemplatesHandler = jest.fn().mockResolvedValue({
      data: getTemplatesDataEmpty,
    });
    mockClient.setRequestHandler(GET_TEMPLATES, getTemplatesHandler);

    await createOrUpdateFlatfileTemplate(mockClient, templateName, template);

    expect(getTemplatesHandler).toHaveBeenCalledWith({
      searchQuery: templateName,
    });
  });

  test("makes a create request when a Portal is not found in Flatfile", async () => {
    getTemplatesHandler = jest.fn().mockResolvedValue({
      data: getTemplatesDataEmpty,
    });
    mockClient.setRequestHandler(GET_TEMPLATES, getTemplatesHandler);

    await createOrUpdateFlatfileTemplate(mockClient, templateName, template);

    expect(createTemplateHandler).toHaveBeenCalledWith({
      name: templateName,
      schema: {
        schema: template,
      },
    });
  });

  test("makes an update request when a Portal is found in Flatfile", async () => {
    getTemplatesHandler = jest.fn().mockResolvedValue({
      data: getTemplatesDataFound,
    });
    mockClient.setRequestHandler(GET_TEMPLATES, getTemplatesHandler);

    await createOrUpdateFlatfileTemplate(mockClient, templateName, template);

    expect(updateTemplateHandler).toHaveBeenCalledWith({
      schemaId: getTemplatesDataFound.getSchemas.data[0].id,
      schema: {
        schema: template,
      },
    });
  });

  test("throws an error when a Flatfile request fails", async () => {
    mockClient.setRequestHandler(GET_TEMPLATES, () =>
      Promise.resolve({ errors: [{ message: "GraphQL Error" }] }),
    );

    await expect(
      createOrUpdateFlatfileTemplate(mockClient, templateName, template),
    ).rejects.toThrow("GraphQL Error");
  });
});
