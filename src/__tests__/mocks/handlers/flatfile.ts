import { rest, graphql } from "msw";

import InitializeEmptyBatch from "src/__tests__/fixtures/flatfile/InitializeEmptyBatch.json";
import {
  FlatfileCreatePortalResponse,
  FlatfileCreateTemplateResponse,
  FlatfileGetFinalDatabaseViewResponse,
  FlatfileGetPortalsResponse,
  FlatfileGetTemplatesResponse,
  FlatfileRow,
  FlatfileTokenExchangeResponse,
  FlatfileUpdatePortalResponse,
  FlatfileUpdateTemplateResponse,
} from "src/interfaces/flatfile/responses";

// Use these variables to verify whether the UPDATE or CREATE method was called
export const mockFlatfileUpdatedTemplate = {
  name: "Update this template 1",
  id: "update-template",
};
export const mockFlatfileUpdatedPortal = {
  name: "Update this portal 1",
  id: "update-portal",
};

const rows: FlatfileRow[] = [
  {
    id: 1,
    status: "accepted",
    valid: true,
    data: { title: "episode 1" },
  },
  {
    id: 2,
    status: "accepted",
    valid: true,
    data: { title: "episode 2" },
  },
];

export const mockFlatfileGetFinalDatabaseView: FlatfileGetFinalDatabaseViewResponse =
  {
    getFinalDatabaseView: {
      totalRows: rows.length,
      rows,
    },
  };

export const mockFlatfileGetFinalDatabaseViewPaginated: FlatfileGetFinalDatabaseViewResponse =
  {
    getFinalDatabaseView: {
      totalRows: rows.length,
      rows: [
        {
          ...rows[0],
          id: 100,
          data: { title: "paginated 1" },
        },
        {
          ...rows[1],
          id: 101,
          data: { title: "paginated 2" },
        },
      ],
    },
  };

export const erroredFlatfileAccessKeyExchangeHandler = rest.post(
  "https://api.us.flatfile.io/auth/access-key/exchange/",
  (req, res, ctx) => {
    return res(ctx.status(500));
  },
);

export const erroredFlatfileTemplateSearch = graphql.query(
  "GET_TEMPLATES",
  (req, res, ctx) => {
    return res(ctx.errors([{ message: "Error fetching templates" }]));
  },
);

export const erroredFlatfilePortalSearch = graphql.query(
  "GET_PORTALS",
  (req, res, ctx) => {
    return res(ctx.errors([{ message: "Error fetching portals" }]));
  },
);

export const flatfileHandlers = [
  rest.post(
    "https://api.us.flatfile.io/auth/access-key/exchange/",
    (req, res, ctx) => {
      const tokenResponse: FlatfileTokenExchangeResponse = {
        accessToken: "flatfile-token",
        user: {
          id: 123,
          name: "Flatfile user",
          email: "user@flatfile.com",
          type: "a-user",
        },
      };

      return res(ctx.status(200), ctx.json(tokenResponse));
    },
  ),

  graphql.query(
    "GET_FINAL_DATABASE_VIEW",
    ({ variables: { offset } }, res, ctx) => {
      if (offset) {
        return res(ctx.data(mockFlatfileGetFinalDatabaseViewPaginated));
      }
      return res(ctx.data(mockFlatfileGetFinalDatabaseView));
    },
  ),

  graphql.query("GET_TEMPLATES", (req, res, ctx) => {
    const data: FlatfileGetTemplatesResponse = {
      getSchemas: {
        data: [mockFlatfileUpdatedTemplate],
      },
    };
    return res(ctx.data(data));
  }),
  graphql.mutation("CREATE_TEMPLATE", (req, res, ctx) => {
    const data: FlatfileCreateTemplateResponse = {
      createSchema: {
        name: "Created Template 1",
        id: "created-template",
      },
    };
    return res(ctx.data(data));
  }),
  graphql.mutation("UPDATE_TEMPLATE", (req, res, ctx) => {
    const data: FlatfileUpdateTemplateResponse = {
      updateSchema: mockFlatfileUpdatedTemplate,
    };
    return res(ctx.data(data));
  }),

  graphql.query("GET_PORTALS", (req, res, ctx) => {
    const data: FlatfileGetPortalsResponse = {
      getEmbeds: {
        data: [mockFlatfileUpdatedPortal],
      },
    };
    return res(ctx.data(data));
  }),

  graphql.mutation("InitializeEmptyBatch", (req, res, ctx) => {
    return res(ctx.data(InitializeEmptyBatch.data));
  }),

  graphql.query("SmartWorkspace", (req, res, ctx) => {
    return res(ctx.data(InitializeEmptyBatch.data));
  }),

  graphql.mutation("CREATE_PORTAL", (req, res, ctx) => {
    const data: FlatfileCreatePortalResponse = {
      createEmbed: {
        embed: {
          name: "Created Portal 1",
          id: "created-portal",
          privateKey: {
            id: "key-1",
            scope: "all",
            key: "flatfile_private_key",
          },
        },
      },
    };
    return res(ctx.data(data));
  }),

  graphql.mutation("UPDATE_PORTAL", (req, res, ctx) => {
    const data: FlatfileUpdatePortalResponse = {
      updateEmbed: {
        ...mockFlatfileUpdatedPortal,
        privateKey: {
          id: "key-1",
          scope: "all",
          key: "flatfile_private_key",
        },
      },
    };
    return res(ctx.data(data));
  }),
];
