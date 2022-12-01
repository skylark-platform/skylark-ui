import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";

import { Button } from "src/components/button";
import { useGetObject } from "src/hooks/useGetObject";
import { useListObjects } from "src/hooks/useListObjects";
import {
  useSkylarkObjectOperations,
  useSkylarkObjectTypes,
} from "src/hooks/useSkylarkObjectTypes";
import { useSkylarkSchema } from "src/hooks/useSkylarkSchema";
import {
  createGetObjectQuery,
  createListObjectQuery,
} from "src/lib/graphql/skylark/dynamicQueries";

export default function Home() {
  const { objectTypes } = useSkylarkObjectTypes();
  const [activeObjectType, setActiveObjectType] = useState(
    objectTypes?.[0] || "Episode",
  );
  const { object, loading } = useSkylarkObjectOperations(activeObjectType);

  // const query = createListObjectQuery(object);
  // const { data, error } = useQuery(
  //   query || gql("query { __unknown { name }}"),
  //   {
  //     ssr: false,
  //     skip: !query,
  //     variables: {
  //       externalId: "external1",
  //     },
  //   },
  // );

  // const { data, error } = useGetObject(activeObjectType, {
  //   externalId: "external1",
  // });

  const { data, error } = useListObjects(activeObjectType);

  // const { data: schema } = useSkylarkSchema();
  // console.log({ object, data });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-10 pt-32 text-black">
      <div className="flex w-3/5 flex-wrap justify-center gap-2">
        {objectTypes &&
          objectTypes.map((type) => (
            <Button
              variant="outline"
              disabled={type === activeObjectType}
              onClick={() => setActiveObjectType(type)}
              key={type}
            >
              {type}
            </Button>
          ))}
      </div>
      {error && <p>{error.message}</p>}

      <pre className="mt-4 h-full w-full bg-white">
        {JSON.stringify(data, null, 8)}
      </pre>
      <pre className="mt-4 h-full w-full bg-white">
        {JSON.stringify(object, null, 8)}
      </pre>
    </div>
  );
}
