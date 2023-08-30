export const LOCAL_STORAGE = {
  betaAuth: {
    uri: "skylark_beta_uri",
    token: "skylark_beta_auth_token",
  },
  usedLanguages: "skylark:usedLanguages",
  accountPrefixed: (accountId: string) => {
    const prefix = `skylark:${accountId}:contentLibrary`;
    return {
      contentLibrary: {
        tabState: `${prefix}:tabState`,
        activeTabIndex: `${prefix}:activeTabIndex`,
        tabsScrollPosition: `${prefix}:tabsScrollPosition`,
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
};
