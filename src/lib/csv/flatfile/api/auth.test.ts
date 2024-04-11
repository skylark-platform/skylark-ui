import { rest } from "msw";

import { server } from "src/__tests__/mocks/server";
import { FlatfileTokenExchangeResponse } from "src/interfaces/flatfile/responses";

import { exchangeFlatfileAccessKey } from "./auth";

test("calls the Flatfile API to get an API token", async () => {
  server.use(
    rest.post(
      "https://api.us.flatfile.io/auth/access-key/exchange/",
      async (req, res, ctx) => {
        const reqBody = await req.json();
        if (
          reqBody.accessKeyId === "accessKeyId" &&
          reqBody.secretAccessKey === "secretAccessKey"
        ) {
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
        }
        return res(ctx.status(500));
      },
    ),
  );

  const got = await exchangeFlatfileAccessKey("accessKeyId", "secretAccessKey");

  expect(got).toEqual({
    accessToken: "flatfile-token",
    user: {
      id: 123,
      name: "Flatfile user",
      email: "user@flatfile.com",
      type: "a-user",
    },
  });
});

test("throws an error when invalid data is returned by Flatfile", async () => {
  server.use(
    rest.post(
      "https://api.us.flatfile.io/auth/access-key/exchange/",
      (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({}));
      },
    ),
  );

  await expect(
    exchangeFlatfileAccessKey("accessKeyId", "secretAccessKey"),
  ).rejects.toThrow("Invalid response returned by Flatfile");
});

test("throws an error when the fetch request fails", async () => {
  server.use(
    rest.post(
      "https://api.us.flatfile.io/auth/access-key/exchange/",
      (req, res, ctx) => {
        return res(ctx.status(500));
      },
    ),
  );

  await expect(
    exchangeFlatfileAccessKey("accessKeyId", "secretAccessKey"),
  ).rejects.toThrow();
});
