import { exchangeFlatfileAccessKey } from "./auth";

const validResponse = {
  accessToken: "accessToken",
  user: {
    id: "user-1",
  },
};

test("calls the Flatfile API to get an API token", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(validResponse),
    }),
  ) as jest.Mock;

  await exchangeFlatfileAccessKey("accessKeyId", "secretAccessKey");

  expect(global.fetch).toHaveBeenCalledWith(
    "https://api.us.flatfile.io/auth/access-key/exchange/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        accessKeyId: "accessKeyId",
        secretAccessKey: "secretAccessKey",
        expiresIn: 60,
      }),
    },
  );
});

test("throws an error when invalid data is returned by Flatfile", async () => {
  global.fetch = jest.fn().mockImplementationOnce(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    }),
  ) as jest.Mock;

  await expect(
    exchangeFlatfileAccessKey("accessKeyId", "secretAccessKey"),
  ).rejects.toThrow("Invalid response returned by Flatfile");
});

test("throws an error when the fetch request fails", async () => {
  global.fetch = jest.fn().mockImplementationOnce(() => {
    throw new Error("failure");
  }) as jest.Mock;

  await expect(
    exchangeFlatfileAccessKey("accessKeyId", "secretAccessKey"),
  ).rejects.toThrow("failure");
});
