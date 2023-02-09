import { Spinner } from "@graphiql/react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

import { LOCAL_STORAGE } from "src/constants/skylark";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

const DynamicGraphQLVoyager = dynamic(
  () =>
    import(
      "../../components/developer/graphqlVoyager/graphqlVoyager.component"
    ).then((mod) => mod.GraphQLVoyager),
  {
    loading: () => (
      <div className="flex w-full justify-center">
        <Spinner className="mt-20 h-10 w-10 animate-spin" />
      </div>
    ),
  },
);

const getEnvironmentFromLocalStorage = () => {
  const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) || "";
  const token = localStorage.getItem(LOCAL_STORAGE.betaAuth.token) || "";
  return { uri, token };
};

export default function GraphQLSchemaVisualiser() {
  const { connected } = useConnectedToSkylark();
  const [{ uri, token }, setEnvironment] = useState({ uri: "", token: "" });

  useEffect(() => {
    const refresh = () => {
      setEnvironment(getEnvironmentFromLocalStorage());
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <>
      {connected && uri && token && (
        <DynamicGraphQLVoyager uri={uri} token={token} />
      )}
    </>
  );
}
