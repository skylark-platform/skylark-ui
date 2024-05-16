export const LOCAL_STORAGE = {
  betaAuth: {
    uri: "skylark_beta_uri",
    token: "skylark_beta_auth_token",
  },
  auth: {
    active: "skylark:auth:active",
  },
  usedLanguages: "skylark:usedLanguages",
  disableBackgroundTaskPolling: `skylark:background_tasks:polling_disabled`,
  accountPrefixed: (accountId: string) => {
    const prefix = `skylark:${accountId}`;
    const contentLibraryPrefix = `${prefix}:contentLibrary`;
    return {
      contentLibrary: {
        tabState: `${contentLibraryPrefix}:tabState`,
        activeTabIndex: `${contentLibraryPrefix}:activeTabIndex`,
        tabsScrollPosition: `${contentLibraryPrefix}:tabsScrollPosition`,
      },
    };
  },
  graphiql: {
    theme: "graphiql:theme",
    tabState: "graphiql:tabState",
    queries: "graphiql:queries",
    query: "graphiql:query",
    variables: "graphiql:variables",
    headers: "graphiql:headers",
  },
  search: {
    columnFilterVariant: "skylark:search:filter:column",
  },
};
