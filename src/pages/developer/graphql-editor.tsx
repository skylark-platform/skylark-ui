import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { DEFAULT_QUERY } from "src/components/developer/graphiqlEditor/graphiqlEditor.component";
import { Spinner } from "src/components/icons";
import { LOCAL_STORAGE } from "src/constants/skylark";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

const DynamicGraphiQLEditor = dynamic(
  () =>
    import(
      "../../components/developer/graphiqlEditor/graphiqlEditor.component"
    ).then((mod) => mod.GraphiQLEditor),
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
  const [defaultQuery, setDefaultQuery] = useState(DEFAULT_QUERY);

  useEffect(() => {
    // Default to light theme https://github.com/graphql/graphiql/issues/2924
    const storedTheme = localStorage.getItem(LOCAL_STORAGE.graphiql.theme);
    if (!storedTheme) {
      localStorage.setItem(LOCAL_STORAGE.graphiql.theme, "light");
    }

    // If a previous active tab exists in localStorage open to that rather than creating a new tab
    const tabStateJSON = localStorage.getItem(LOCAL_STORAGE.graphiql.tabState);
    if (tabStateJSON) {
      try {
        const tabState: {
          tabs: { id: string; title: string; query: string }[];
          activeTabIndex: number;
        } = JSON.parse(tabStateJSON);

        const lastActiveTab = tabState.tabs[tabState.activeTabIndex];
        if (lastActiveTab && lastActiveTab.query) {
          setDefaultQuery(lastActiveTab.query);
        }
      } catch (err) {
        console.warn("GraphiQL TabState set but invalid JSON", tabStateJSON);
      }
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
        <DynamicGraphiQLEditor
          uri={uri}
          token={token}
          defaultQuery={defaultQuery}
        />
      )}
    </div>
  );
}
