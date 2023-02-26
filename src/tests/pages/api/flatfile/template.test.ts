import jwt from "jsonwebtoken";
import { graphql } from "msw";
import { createMocks } from "node-mocks-http";

import * as constants from "src/constants/flatfile";
import {
  FlatfileCreatePortalResponse,
  FlatfileCreateTemplateResponse,
  FlatfileGetPortalsResponse,
  FlatfileGetTemplatesResponse,
} from "src/interfaces/flatfile/responses";
import * as flatfile from "src/lib/flatfile";
import handler from "src/pages/api/flatfile/template";
import {
  erroredFlatfileAccessKeyExchangeHandler,
  erroredFlatfileTemplateSearch,
} from "src/tests/mocks/handlers/flatfile";
import { server } from "src/tests/mocks/server";

const mockConstants = constants as {
  FLATFILE_ACCESS_KEY_ID: string | null;
  FLATFILE_SECRET_KEY: string | null;
  FLATFILE_ORG: {
    id: string;
    name: string;
  };
};

jest.mock("jsonwebtoken");

const template = {
  type: "object",
  properties: {
    title: {
      label: "label",
      type: "string",
    },
  },
};

const flatfileOrg = {
  id: "teamId",
  name: "teamName",
};

beforeEach(() => {
  mockConstants.FLATFILE_ACCESS_KEY_ID = "accessKeyId";
  mockConstants.FLATFILE_SECRET_KEY = "secretKey";
  mockConstants.FLATFILE_ORG = flatfileOrg;
});

afterEach(() => {
  jest.resetAllMocks();
});

test("returns 501 when the method is not POST", async () => {
  const { req, res } = createMocks({
    method: "GET",
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(501);
});

test("returns 503 when FLATFILE_ACCESS_KEY_ID or FLATFILE_SECRET_KEY are falsy", async () => {
  mockConstants.FLATFILE_ACCESS_KEY_ID = null;

  const { req, res } = createMocks({
    method: "POST",
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(503);
});

test("returns 400 when a request body is missing", async () => {
  const { req, res } = createMocks({
    method: "POST",
    body: {},
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(400);
  expect(res._getData()).toEqual(
    'Invalid request body: missing "template", "name", "accountIdentifier"',
  );
});

test("returns 400 when the name is missing from the request body", async () => {
  const { req, res } = createMocks({
    method: "POST",
    body: {
      template: {},
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(400);
  expect(res._getData()).toEqual('Invalid request body: missing "name"');
});

test("returns 400 when the template is missing from the request body", async () => {
  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(400);
  expect(res._getData()).toEqual('Invalid request body: missing "template"');
});

test("returns 400 when the accountIdentifier is missing from the request body", async () => {
  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template: {},
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(400);
  expect(res._getData()).toEqual(
    'Invalid request body: missing "accountIdentifier"',
  );
});

test("returns 400 when the template validation fails", async () => {
  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template: {},
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual(
    'Schema error: required schema properties are "type", "properties"',
  );
  expect(res._getStatusCode()).toBe(400);
});

test("returns 500 when an error occurs while getting a token from Flatfile", async () => {
  server.use(erroredFlatfileAccessKeyExchangeHandler);

  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template,
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual("Error exchanging Flatfile token");
  expect(res._getStatusCode()).toBe(500);
});

test("returns 500 when the Flatfile Template or Portal creation errors", async () => {
  server.use(erroredFlatfileTemplateSearch);

  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template,
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual("Error creating Flatfile Template and Portal");
  expect(res._getStatusCode()).toBe(500);
});

test("returns 500 when the Flatfile Template creation does not return an ID", async () => {
  server.use(
    graphql.query("GET_TEMPLATES", (req, res, ctx) => {
      const data: FlatfileGetTemplatesResponse = {
        getSchemas: {
          data: [],
        },
      };
      return res(ctx.data(data));
    }),
    graphql.mutation("CREATE_TEMPLATE", (req, res, ctx) => {
      const data: FlatfileCreateTemplateResponse = {
        createSchema: {
          name: "",
          id: "",
        },
      };
      return res(ctx.data(data));
    }),
  );

  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template,
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual("No Template ID returned by Flatfile");
  expect(res._getStatusCode()).toBe(500);
});

test("returns 500 when the Flatfile Portal creation does not return an ID", async () => {
  server.use(
    graphql.query("GET_PORTALS", (req, res, ctx) => {
      const data: FlatfileGetPortalsResponse = {
        getEmbeds: {
          data: [],
        },
      };
      return res(ctx.data(data));
    }),
    graphql.mutation("CREATE_PORTAL", (req, res, ctx) => {
      const data: FlatfileCreatePortalResponse = {
        createEmbed: {
          embed: {
            name: "",
            id: "",
            privateKey: {
              id: "",
              scope: "",
              key: "",
            },
          },
        },
      };
      return res(ctx.data(data));
    }),
  );

  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template,
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual("No Portal ID returned by Flatfile");
  expect(res._getStatusCode()).toBe(500);
});

test("returns 200, the created Portal ID and import token when the Flatfile Template and Portal are created successfully", async () => {
  const mockedSign = jwt.sign as jest.Mock;
  mockedSign.mockReturnValue("import-token");

  server.use(
    graphql.query("GET_TEMPLATES", (req, res, ctx) => {
      const data: FlatfileGetTemplatesResponse = {
        getSchemas: {
          data: [],
        },
      };
      return res(ctx.data(data));
    }),
    graphql.query("GET_PORTALS", (req, res, ctx) => {
      const data: FlatfileGetPortalsResponse = {
        getEmbeds: {
          data: [],
        },
      };
      return res(ctx.data(data));
    }),
  );

  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template,
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual(
    JSON.stringify({
      embedId: "created-portal",
      token: "import-token",
    }),
  );
  expect(res._getStatusCode()).toBe(200);
  expect(mockedSign).toHaveBeenCalledWith(
    {
      embed: "created-portal",
      org: flatfileOrg,
      user: {
        email: "user@flatfile.com",
        id: 123,
        name: "Flatfile user",
      },
    },
    "flatfile_private_key",
  );
});

test("returns 200, the updated Portal ID when the Flatfile Template and Portal are updated successfully", async () => {
  const mockedSign = jwt.sign as jest.Mock;
  mockedSign.mockReturnValue("import-token");

  const { req, res } = createMocks({
    method: "POST",
    body: {
      name: "name",
      template,
      accountIdentifier: "account",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual(
    JSON.stringify({
      embedId: "update-portal",
      token: "import-token",
    }),
  );
  expect(res._getStatusCode()).toBe(200);
  expect(mockedSign).toHaveBeenCalledWith(
    {
      embed: "update-portal",
      org: flatfileOrg,
      user: {
        email: "user@flatfile.com",
        id: 123,
        name: "Flatfile user",
      },
    },
    "flatfile_private_key",
  );
});
