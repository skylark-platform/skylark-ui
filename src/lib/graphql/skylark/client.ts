import {
  ApolloClient,
  defaultDataIdFromObject,
  InMemoryCache,
} from "@apollo/client";

import { SAAS_API_KEY, SAAS_API_ENDPOINT } from "src/constants/skylark";

export const createSkylarkClient = () =>
  new ApolloClient({
    uri: SAAS_API_ENDPOINT,
    cache: new InMemoryCache({
      dataIdFromObject(responseObject) {
        // Skylark objects use the uid field as their ID, Apollo client looks for _id and id by default
        if (Object.prototype.hasOwnProperty.call(responseObject, "uid")) {
          return `${responseObject.__typename}:${responseObject.uid}`;
        }
        return defaultDataIdFromObject(responseObject);
      },
    }),
    headers: {
      "x-api-key": SAAS_API_KEY,
    },
  });

export type SkylarkClient = ReturnType<typeof createSkylarkClient>;
