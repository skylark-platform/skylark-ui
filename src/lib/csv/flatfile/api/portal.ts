import {
  FlatfileCreatePortalResponse,
  FlatfileGetPortalsResponse,
  FlatfileUpdatePortalResponse,
} from "src/interfaces/flatfile/responses";
import { FlatfileClient } from "src/lib/graphql/flatfile/client";
import {
  CREATE_PORTAL,
  UPDATE_PORTAL,
} from "src/lib/graphql/flatfile/mutations";
import { GET_PORTALS } from "src/lib/graphql/flatfile/queries";

export const createOrUpdateFlatfilePortal = async (
  client: FlatfileClient,
  name: string,
  templateId: string,
) => {
  const data = await client.request<FlatfileGetPortalsResponse>(GET_PORTALS, {
    searchQuery: name,
  });

  const foundPortals = data.getEmbeds.data;

  if (foundPortals.length > 0) {
    const [portal] = foundPortals;
    const updatePortalResponse =
      await client.request<FlatfileUpdatePortalResponse>(UPDATE_PORTAL, {
        portalId: portal.id,
        templateId,
      });

    return updatePortalResponse.updateEmbed;
  }

  const createPortalResponse =
    await client.request<FlatfileCreatePortalResponse>(CREATE_PORTAL, {
      name,
      templateId,
    });

  return createPortalResponse.createEmbed.embed;
};
