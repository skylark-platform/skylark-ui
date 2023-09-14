import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReadLocalStorage } from "usehooks-ts";

import { DEFAULT_QUERY } from "src/components/graphiqlEditor/graphiqlEditor.component";
import { Spinner } from "src/components/icons";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

const DynamicGraphiQLEditor = dynamic(
  () =>
    import("../../components/graphiqlEditor/graphiqlEditor.component").then(
      (mod) => mod.GraphiQLEditor,
    ),
  {
    loading: () => (
      <div className="flex w-full justify-center">
        <Spinner className="mt-20 h-10 w-10 animate-spin" />
      </div>
    ),
  },
);

export default function GraphQLQueryEditor() {
  const { isConnected } = useConnectedToSkylark();
  const [defaultQuery, setDefaultQuery] = useState(DEFAULT_QUERY);

  const [creds] = useSkylarkCreds();

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
  }, []);

  return (
    <div className="pt-nav h-full w-full">
      {isConnected && creds?.uri && creds.token && (
        <DynamicGraphiQLEditor
          uri={creds.uri}
          token={creds.token}
          defaultQuery={defaultQuery}
        />
      )}
    </div>
  );
}
