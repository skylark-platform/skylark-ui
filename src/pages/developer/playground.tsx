import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { LOCAL_STORAGE } from "src/constants/skylark";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

const DynamicGraphiQLPlayground = dynamic(
  () =>
    import(
      "../../components/graphiqlPlayground/graphiqlPlayground.component"
    ).then((mod) => mod.GraphiQLPlayground),
  {
    loading: () => <div className="w-full text-center">Loading...</div>,
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
