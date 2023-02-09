import { Voyager } from "graphql-voyager";

import { REQUEST_HEADERS } from "src/constants/skylark";

interface GraphQLVoyagerProps {
  uri: string;
  token: string;
}

export const GraphQLVoyager = ({ uri, token }: GraphQLVoyagerProps) => {
  const introspectionProvider = (query: string) => {
    return fetch(uri, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        [REQUEST_HEADERS.apiKey]: token,
      },
      body: JSON.stringify({ query: query }),
    }).then((response) => response.json());
  };

  return <Voyager introspection={introspectionProvider} />;
};
