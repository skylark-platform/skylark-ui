import { createMockClient, MockApolloClient } from "mock-apollo-client";

import {
  FlatfileCreatePortalResponse,
  FlatfileGetPortalsResponse,
  FlatfileUpdatePortalResponse,
} from "src/interfaces/flatfile/responses";
import {
  CREATE_PORTAL,
  UPDATE_PORTAL,
} from "src/lib/graphql/flatfile/mutations";
import { GET_PORTALS } from "src/lib/graphql/flatfile/queries";

import { createOrUpdateFlatfilePortal } from "./portal";

const portalName = "portalName";
const templateId = "1234";

const getPortalsDataEmpty: FlatfileGetPortalsResponse = {
  getEmbeds: {
    data: [],
  },
};

const getPortalsDataFound: FlatfileGetPortalsResponse = {
  getEmbeds: {
    data: [
      {
        id: "portal-1",
        name: "Portal 1",
      },
    ],
  },
};

let mockClient: MockApolloClient;
let getPortalsHandler: jest.Mock;
let createPortalHandler: jest.Mock;
let updatePortalHandler: jest.Mock;

beforeEach(() => {
  mockClient = createMockClient();

  const createPortalData: FlatfileCreatePortalResponse = {
    createEmbed: {
      embed: {
        id: "portal-1",
        name: "Portal 1",
        privateKey: {
          id: "private-key-1",
          scope: "all",
          key: "12345",
        },
      },
    },
  };
  createPortalHandler = jest.fn().mockResolvedValue({
    data: createPortalData,
  });

  const updatePortalData: FlatfileUpdatePortalResponse = {
    updateEmbed: {
      id: "portal-1",
      name: "Portal 1",
      privateKey: {
        id: "private-key-1",
        scope: "all",
        key: "12345",
      },
    },
  };
  updatePortalHandler = jest.fn().mockResolvedValue({
    data: updatePortalData,
  });

  mockClient.setRequestHandler(CREATE_PORTAL, createPortalHandler);
  mockClient.setRequestHandler(UPDATE_PORTAL, updatePortalHandler);
});

test("makes a request to get all the Portals from Flatfile", async () => {
  getPortalsHandler = jest.fn().mockResolvedValue({
    data: getPortalsDataEmpty,
  });
  mockClient.setRequestHandler(GET_PORTALS, getPortalsHandler);

  await createOrUpdateFlatfilePortal(mockClient, portalName, templateId);

  expect(getPortalsHandler).toHaveBeenCalledWith({ searchQuery: portalName });
});

test("makes a create request when a Portal is not found in Flatfile", async () => {
  getPortalsHandler = jest.fn().mockResolvedValue({
    data: getPortalsDataEmpty,
  });
  mockClient.setRequestHandler(GET_PORTALS, getPortalsHandler);

  await createOrUpdateFlatfilePortal(mockClient, portalName, templateId);

  expect(createPortalHandler).toHaveBeenCalledWith({
    name: portalName,
    templateId,
  });
});

test("makes an update request when a Portal is found in Flatfile", async () => {
  getPortalsHandler = jest.fn().mockResolvedValue({
    data: getPortalsDataFound,
  });
  mockClient.setRequestHandler(GET_PORTALS, getPortalsHandler);

  await createOrUpdateFlatfilePortal(mockClient, portalName, templateId);

  expect(updatePortalHandler).toHaveBeenCalledWith({
    portalId: getPortalsDataFound.getEmbeds.data[0].id,
    templateId,
  });
});

test("throws an error when a Flatfile request fails", async () => {
  mockClient.setRequestHandler(GET_PORTALS, () =>
    Promise.resolve({ errors: [{ message: "GraphQL Error" }] }),
  );

  await expect(
    createOrUpdateFlatfilePortal(mockClient, portalName, templateId),
  ).rejects.toThrow("GraphQL Error");
});
