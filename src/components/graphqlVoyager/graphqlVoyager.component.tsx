import { useQuery } from "@tanstack/react-query";
import { Voyager, voyagerIntrospectionQuery } from "graphql-voyager";
import "graphql-voyager/dist/voyager.css";
import { useEffect } from "react";

import { skylarkRequest } from "src/lib/graphql/skylark/client";

const useSkylarkSchemaIntrospection = () => {
  const { data, ...rest } = useQuery({
    queryKey: ["test", voyagerIntrospectionQuery],
    queryFn: async () => skylarkRequest(voyagerIntrospectionQuery),
  });

  return {
    data,
    ...rest,
  };
};

export const GraphQLVoyager = () => {
  const { data, isLoading } = useSkylarkSchemaIntrospection();

  const introspection = skylarkRequest(voyagerIntrospectionQuery);
  console.log({ introspection, data });

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {data && (
        <Voyager
          introspection={{ data }}
          // displayOptions={{ skipRelay: false, showLeafFields: true }}
        />
      )}
    </div>
  );
};
