import type { NextApiRequest, NextApiResponse } from "next";

import {
  FLATFILE_ACCESS_KEY_ID,
  FLATFILE_SECRET_KEY,
} from "src/constants/flatfile";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import { SkylarkImportedObject } from "src/interfaces/skylark";
import {
  createFlatfileObjectsInSkylark,
  exchangeFlatfileAccessKey,
  getFlatfileFinalDatabaseView,
} from "src/lib/flatfile";
import { createFlatfileClient } from "src/lib/graphql/flatfile/client";
import { createBasicSkylarkClient } from "src/lib/graphql/skylark/client";
import { getSkylarkObjectTypes } from "src/lib/skylark/introspection/introspection";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FlatfileRow[] | string>,
) {
  if (req.method !== "POST") {
    return res.status(501).end();
  }

  if (!req.body || req.body === null || Object.keys(req.body).length === 0) {
    return res.status(400).send("Invalid request body");
  }

  const { body } = req;

  if (!FLATFILE_ACCESS_KEY_ID || !FLATFILE_SECRET_KEY) {
    return res
      .status(500)
      .send("No Flatfile Access Key ID or Flatfile Secret supplied");
  }

  const { batchId, objectType, graphQLUri, graphQLToken } = body;
  if (!batchId || !objectType) {
    return res.status(500).send("batchId and objectType are mandatory");
  }

  if (!graphQLUri || !graphQLToken) {
    return res
      .status(500)
      .send("Skylark GraphQL URI and Access Key are mandatory");
  }

  const skylarkClient = createBasicSkylarkClient(graphQLUri, graphQLToken);

  const objects = await getSkylarkObjectTypes(skylarkClient);
  const isObjectValid = objects.find((object) => object === objectType);

  if (!isObjectValid) {
    return res
      .status(500)
      .send(`Object type "${objectType}" does not exist in Skylark`);
  }

  let flatfileAccessToken = "";
  try {
    const data = await exchangeFlatfileAccessKey(
      FLATFILE_ACCESS_KEY_ID,
      FLATFILE_SECRET_KEY,
    );

    flatfileAccessToken = data.accessToken;
  } catch (err) {
    if ((err as Error).message) {
      return res.status(500).send((err as Error).message);
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

  return res.status(200).send(flatfileRows);
}
