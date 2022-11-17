import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  FLATFILE_ACCESS_KEY_ID,
  FLATFILE_ORG,
  FLATFILE_SECRET_KEY,
} from "src/constants/flatfile";
import { SAAS_ACCOUNT_ID } from "src/constants/skylark";
import { ApiRouteTemplateData } from "src/interfaces/apiRoutes";
import { FlatfileTemplate } from "src/interfaces/flatfile/template";
import {
  createOrUpdateFlatfilePortal,
  createOrUpdateFlatfileTemplate,
  exchangeFlatfileAccessKey,
  validateRequestTemplate,
} from "src/lib/flatfile";
import { createFlatfileClient } from "src/lib/graphql/flatfile/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiRouteTemplateData | string | Error>,
) {
  if (req.method !== "POST") {
    return res.status(501).end();
  }

  if (!FLATFILE_ACCESS_KEY_ID || !FLATFILE_SECRET_KEY) {
    return res
      .status(503)
      .send(
        "Server has not been configured with a Flatfile Access Key ID or Flatfile Secret",
      );
  }

  const body = req.body as { template?: object; name?: string };

  if (!body || !body.template || !body.name) {
    return res
      .status(400)
      .send(
        `Invalid request body: missing "${
          !body.template ? "template" : "name"
        }"`,
      );
  }

  const name = `${req.body.name as string}-${SAAS_ACCOUNT_ID}`.toLowerCase();
  const requestTemplate = req.body.template as FlatfileTemplate;

  try {
    validateRequestTemplate(requestTemplate);
  } catch (err) {
    return res.status(400).send((err as Error).message);
  }

  let user = { id: 0, name: "", email: "" };
  let flatfileAccessToken = "";

  try {
    const data = await exchangeFlatfileAccessKey(
      FLATFILE_ACCESS_KEY_ID,
      FLATFILE_SECRET_KEY,
    );

    user = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
    };
    flatfileAccessToken = data.accessToken;
  } catch (err) {
    return res.status(500).send("Error exchanging Flatfile token");
  }

  const flatfileClient = createFlatfileClient(flatfileAccessToken);

  try {
    const template = await createOrUpdateFlatfileTemplate(
      flatfileClient,
      name,
      requestTemplate,
    );

    if (!template || !template.id) {
      return res.status(500).send("No Template ID returned by Flatfile");
    }

    const portal = await createOrUpdateFlatfilePortal(
      flatfileClient,
      name,
      template.id,
    );

    if (!portal || !portal.id) {
      return res.status(500).send("No Portal ID returned by Flatfile");
    }

    const importToken = jwt.sign(
      {
        embed: portal.id,
        user,
        org: FLATFILE_ORG,
      },
      portal.privateKey.key,
    );

    res.status(200).json({ embedId: portal.id, token: importToken });
  } catch (err) {
    return res.status(500).send("Error creating Flatfile Template and Portal");
  }
}
