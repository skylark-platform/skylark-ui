import type { NextApiRequest, NextApiResponse } from "next";

import {
  FLATFILE_ACCESS_KEY_ID,
  FLATFILE_SECRET_KEY,
} from "src/constants/flatfile";
import {
  ApiRouteFlatfileImportRequestBody,
  ApiRouteFlatfileImportResponse,
} from "src/interfaces/apiRoutes";
import {
  exchangeFlatfileAccessKey,
  getFlatfileFinalDatabaseView,
} from "src/lib/flatfile";
import { createFlatfileClient } from "src/lib/graphql/flatfile/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiRouteFlatfileImportResponse | string>,
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

  const { batchId, limit, offset }: ApiRouteFlatfileImportRequestBody = body;
  if (!batchId || !limit) {
    return res.status(500).send("batchId and limit are mandatory");
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
    limit,
    offset,
  );
  const flatfileRows = finalDatabaseView.rows.filter(
    (item) => item.status === "accepted" && item.valid,
  );

  return res.status(200).send({
    totalRows: finalDatabaseView.totalRows,
    rows: flatfileRows,
  });
}
