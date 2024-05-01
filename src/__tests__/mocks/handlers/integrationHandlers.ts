import { rest } from "msw";

import GetAllIntegrationsFixture from "src/__tests__/fixtures/skylark/integrationService/getAllIntegrations.json";
import MuxUploadUrlFixture from "src/__tests__/fixtures/skylark/integrationService/uploadUrl/video/mux.json";

const hookBaseUrl = "https://hook.skylarkplatform.com";

export const integrationHandlers = [
  rest.get(`${hookBaseUrl}/`, (req, res, ctx) => {
    return res(ctx.body(JSON.stringify(GetAllIntegrationsFixture)));
  }),

  rest.post(`${hookBaseUrl}/upload-url/video/mux`, (req, res, ctx) => {
    return res(ctx.body(JSON.stringify(MuxUploadUrlFixture)));
  }),
];
