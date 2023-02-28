import { FlatfileTokenExchangeResponse } from "src/interfaces/flatfile/responses";

export const exchangeFlatfileAccessKey = async (
  accessKeyId: string,
  secretAccessKey: string,
): Promise<FlatfileTokenExchangeResponse> => {
  const headers = {
    accept: "application/json",
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    accessKeyId,
    secretAccessKey,
    expiresIn: 60, // we only require a short lifespan
  });

  const tokenRes = await fetch(
    "https://api.us.flatfile.io/auth/access-key/exchange/",
    {
      method: "POST",
      headers,
      body,
    },
  );

  const data = (await tokenRes.json()) as FlatfileTokenExchangeResponse;

  if (
    !data ||
    !data.accessToken ||
    !data.user ||
    Object.keys(data.user).length === 0
  ) {
    throw new Error("Invalid response returned by Flatfile");
  }

  return data;
};
