export const LOCAL_STORAGE = {
  betaAuth: {
    uri: "skylark_beta_uri",
    token: "skylark_beta_auth_token",
  },
  usedLanguages: "skylark:usedLanguages",
  accountPrefixed: (accountId: string) => {
    const prefix = `skylark:${accountId}`;
    return {
      contentLibrary: {
        tabState: `${prefix}:contentLibrary:tabState`,
        activeTabIndex: `${prefix}:contentLibrary:activeTabIndex`,
      },
    };
  },
  graphiql: {
    theme: "graphiql:theme",
    tabState: "graphiql:tabState",
    queries: "graphiql:queries",
    query: "graphiql:query",
    variables: "graphiql:variables",
  },
};
