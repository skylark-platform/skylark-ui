import jwt from "jsonwebtoken";
import { createMocks } from "node-mocks-http";

import * as constants from "src/constants/flatfile";
import {
  FlatfileCreatePortalResponse,
  FlatfileCreateTemplateResponse,
} from "src/interfaces/flatfile/responses";
import * as flatfile from "src/lib/flatfile";
import handler from "src/pages/api/flatfile/template";

const mockConstants = constants as {
  FLATFILE_ACCESS_KEY_ID: string | null;
  FLATFILE_SECRET_KEY: string | null;
  FLATFILE_ORG: {
    id: string;
    name: string;
  };
};

jest.mock("jsonwebtoken");
jest.mock("../../../../constants/flatfile", () => ({
  __esModule: true,
}));
jest.mock("../../../../lib/flatfile", () => ({
  ...jest.requireActual("../../../../lib/flatfile"),
  exchangeFlatfileAccessKey: jest.fn(),
  createOrUpdateFlatfileTemplate: jest.fn(),
  createOrUpdateFlatfilePortal: jest.fn(),
}));

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

const flatfileUserAndToken = {
  accessToken: "token",
  user: {
    id: 123,
    name: "User 1",
    email: "user1@email.com",
    type: "user type",
  },
};

const flatfileTemplate: FlatfileCreateTemplateResponse["createSchema"] = {
  id: "template-1",
  name: "Template 1",
};

const flatfilePortal: FlatfileCreatePortalResponse["createEmbed"]["embed"] = {
  id: "portal-1",
  name: "Portal 1",
  privateKey: {
    id: "key-1",
    scope: "all",
    key: "12345",
  },
};

let spiedExchangeFlatfileAccessKey: jest.SpyInstance;
let spiedCreateOrUpdateFlatfileTemplate: jest.SpyInstance;
let spiedCreateOrUpdateFlatfilePortal: jest.SpyInstance;

beforeEach(() => {
  mockConstants.FLATFILE_ACCESS_KEY_ID = "accessKeyId";
  mockConstants.FLATFILE_SECRET_KEY = "secretKey";
  mockConstants.FLATFILE_ORG = flatfileOrg;

  spiedExchangeFlatfileAccessKey = jest.spyOn(
    flatfile,
    "exchangeFlatfileAccessKey",
  );
  spiedCreateOrUpdateFlatfileTemplate = jest.spyOn(
    flatfile,
    "createOrUpdateFlatfileTemplate",
  );
  spiedCreateOrUpdateFlatfilePortal = jest.spyOn(
    flatfile,
    "createOrUpdateFlatfilePortal",
  );
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
  spiedExchangeFlatfileAccessKey.mockImplementationOnce(async () => {
    throw new Error("fail");
  });

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

test("returns 500 when the Flatfile Template creation errors", async () => {
  spiedExchangeFlatfileAccessKey.mockResolvedValue(flatfileUserAndToken);
  spiedCreateOrUpdateFlatfileTemplate.mockImplementationOnce(async () => {
    throw new Error("");
  });

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
  spiedExchangeFlatfileAccessKey.mockResolvedValue(flatfileUserAndToken);
  spiedCreateOrUpdateFlatfileTemplate.mockResolvedValue({});

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

test("returns 500 when the Flatfile Portal creation errors", async () => {
  spiedExchangeFlatfileAccessKey.mockResolvedValue(flatfileUserAndToken);
  spiedCreateOrUpdateFlatfileTemplate.mockResolvedValue(flatfileTemplate);
  spiedCreateOrUpdateFlatfilePortal.mockImplementationOnce(async () => {
    throw new Error("");
  });

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

test("returns 500 when the Flatfile Portal creation does not return an ID", async () => {
  spiedExchangeFlatfileAccessKey.mockResolvedValue(flatfileUserAndToken);
  spiedCreateOrUpdateFlatfileTemplate.mockResolvedValue(flatfileTemplate);
  spiedCreateOrUpdateFlatfilePortal.mockResolvedValue({});

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

test("returns 200, a portal ID and import token when the Flatfile Template and Portal is created successfully", async () => {
  spiedExchangeFlatfileAccessKey.mockResolvedValue(flatfileUserAndToken);
  spiedCreateOrUpdateFlatfileTemplate.mockResolvedValue(flatfileTemplate);
  spiedCreateOrUpdateFlatfilePortal.mockResolvedValue(flatfilePortal);

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
      embedId: flatfilePortal.id,
      token: "import-token",
    }),
  );
  expect(res._getStatusCode()).toBe(200);
  expect(mockedSign).toHaveBeenCalledWith(
    {
      embed: flatfilePortal.id,
      org: flatfileOrg,
      user: {
        email: flatfileUserAndToken.user.email,
        id: flatfileUserAndToken.user.id,
        name: flatfileUserAndToken.user.name,
      },
    },
    flatfilePortal.privateKey.key,
  );
});
