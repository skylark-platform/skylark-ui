import type { NextApiRequest, NextApiResponse } from "next";

import {
  FLATFILE_ACCESS_KEY_ID,
  FLATFILE_SECRET_KEY,
} from "src/constants/flatfile";
import { ApiRouteWowzaUploadUrlRequestBody } from "src/interfaces/apiRoutes";
import {
  exchangeFlatfileAccessKey,
  getFlatfileFinalDatabaseView,
} from "src/lib/flatfile";
import { createFlatfileClient } from "src/lib/graphql/flatfile/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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

  const { uploadUrl }: ApiRouteWowzaUploadUrlRequestBody = body;
  if (!uploadUrl) {
    return res.status(500).send("uploadUrl is mandatory");
  }

  return res.status(200).send({ obj: true });
}
