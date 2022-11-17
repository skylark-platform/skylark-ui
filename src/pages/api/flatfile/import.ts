import type { NextApiRequest, NextApiResponse } from "next";

import {
  createFlatfileObjectsInSkylark,
  exchangeFlatfileAccessKey,
} from "src/lib/flatfile";
import { getFlatfileFinalDatabaseView } from "src/lib/flatfile/api/databaseView";
import { createFlatfileClient } from "src/lib/graphql/flatfile/client";
import { createSkylarkClient } from "src/lib/graphql/skylark/client";
import { getSkylarkObjectTypes } from "src/lib/skylark/introspection";

interface Data {
  embedId: string;
  token: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | string>,
) {
  if (req.method !== "POST") {
    return res.status(501).end();
  }

  if (!req.body) {
    return res.status(400).send("Invalid request body");
  }

  const { body } = req;

  if (!process.env.FLATFILE_ACCESS_KEY_ID || !process.env.FLATFILE_SECRET_KEY) {
    return res
      .status(500)
      .send("No Flatfile Access Key ID or Flatfile Secret supplied");
  }

  const { batchId, objectType } = body;
  if (!batchId || !objectType) {
    return res.status(500).send("batchId and objectType are mandatory");
  }

  const skylarkClient = createSkylarkClient();

  const objects = await getSkylarkObjectTypes(skylarkClient);
  const isObjectValid = objects.find((item) => item.name === objectType);

  if (!isObjectValid) {
    return res
      .status(500)
      .send(`Object "${objectType}" does not exist in Skylark`);
  }

  let flatfileAccessToken = "";
  try {
    const data = await exchangeFlatfileAccessKey(
      process.env.FLATFILE_ACCESS_KEY_ID,
      process.env.FLATFILE_SECRET_KEY,
    );

    flatfileAccessToken = data.accessToken;
  } catch (err) {
    if ((err as Error).message) {
      res.status(500).send((err as Error).message);
    }
    return res.status(500).send("Error exchanging Flatfile token");
  }

  const flatfileClient = createFlatfileClient(flatfileAccessToken);

  const finalDatabaseView = await getFlatfileFinalDatabaseView(
    flatfileClient,
    batchId,
  );
  const flatfileRows = finalDatabaseView.rows.filter(
    (item) => item.status === "accepted" && item.valid,
  );

  const skylarkObjects = await createFlatfileObjectsInSkylark(
    skylarkClient,
    objectType,
    batchId,
    flatfileRows,
  );

  return res.status(200).send(skylarkObjects);
}
