import { graphql } from "msw";

import {
  erroredFlatfilePortalSearch,
  mockFlatfileUpdatedPortal,
} from "src/__tests__/mocks/handlers/flatfile";
import { server } from "src/__tests__/mocks/server";
import { FlatfileGetPortalsResponse } from "src/interfaces/flatfile/responses";
import {
  createFlatfileClient,
  FlatfileClient,
} from "src/lib/graphql/flatfile/client";

import { createOrUpdateFlatfilePortal } from "./portal";

const portalName = "portalName";
const templateId = "1234";

let flatfileClient: FlatfileClient;

beforeEach(() => {
  flatfileClient = createFlatfileClient("token");
});

test("makes a create request when a Portal is not found in Flatfile", async () => {
  server.use(
    graphql.query("GET_PORTALS", (req, res, ctx) => {
      const data: FlatfileGetPortalsResponse = {
        getEmbeds: {
          data: [],
        },
      };
      return res(ctx.data(data));
    }),
  );

  const got = await createOrUpdateFlatfilePortal(
    flatfileClient,
    portalName,
    templateId,
  );

  expect(got).toEqual({
    id: "created-portal",
    name: "Created Portal 1",
    privateKey: {
      id: "key-1",
      key: "flatfile_private_key",
      scope: "all",
    },
  });
});

test("makes an update request when a Portal is found in Flatfile", async () => {
  const got = await createOrUpdateFlatfilePortal(
    flatfileClient,
    portalName,
    templateId,
  );

  expect(got).toEqual({
    ...mockFlatfileUpdatedPortal,
    privateKey: {
      id: "key-1",
      key: "flatfile_private_key",
      scope: "all",
    },
  });
});

test("throws an error when a Flatfile request fails", async () => {
  server.use(erroredFlatfilePortalSearch);

  await expect(
    createOrUpdateFlatfilePortal(flatfileClient, portalName, templateId),
  ).rejects.toThrow("Error fetching portals");
});
