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
  const { data } = await client.query<FlatfileGetPortalsResponse>({
    query: GET_PORTALS,
    variables: {
      searchQuery: name,
    },
  });

  const foundPortals = data.getEmbeds.data;

  if (foundPortals.length > 0) {
    const [portal] = foundPortals;
    const updatePortalResponse =
      await client.mutate<FlatfileUpdatePortalResponse>({
        mutation: UPDATE_PORTAL,
        variables: {
          portalId: portal.id,
          templateId,
        },
      });

    return updatePortalResponse.data?.updateEmbed;
  }

  const createPortalResponse =
    await client.mutate<FlatfileCreatePortalResponse>({
      mutation: CREATE_PORTAL,
      variables: {
        name,
        templateId,
      },
    });

  return createPortalResponse.data?.createEmbed.embed;
};
