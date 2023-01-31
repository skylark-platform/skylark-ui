import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { Spinner } from "src/components/icons";
import { LOCAL_STORAGE } from "src/constants/skylark";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

const DynamicGraphiQLPlayground = dynamic(
  () =>
    import(
      "../../components/graphiqlPlayground/graphiqlPlayground.component"
    ).then((mod) => mod.GraphiQLPlayground),
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

export default function GraphQLQueryEditor() {
  const { connected } = useConnectedToSkylark();
  const [{ uri, token }, setEnvironment] = useState({ uri: "", token: "" });

  useEffect(() => {
    // Default to light theme https://github.com/graphql/graphiql/issues/2924
    const storedTheme = localStorage.getItem("graphiql:theme");
    if (!storedTheme) {
      localStorage.setItem("graphiql:theme", "light");
    }

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
    <div className="pt-nav h-full w-full">
      {connected && uri && token && (
        <DynamicGraphiQLPlayground uri={uri} token={token} />
      )}
    </div>
  );
}
