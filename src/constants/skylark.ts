export const SKYLARK_GRAPHQL_URL = (process.env.NEXT_PUBLIC_SKYLARK_API_URL ||
  process.env.SKYLARK_API_URL) as string;
export const SAAS_API_ENDPOINT = (process.env.NEXT_PUBLIC_SAAS_API_ENDPOINT ||
  process.env.SAAS_API_ENDPOINT) as string;
export const SAAS_API_KEY = (process.env.NEXT_PUBLIC_SAAS_API_KEY ||
  process.env.SAAS_API_KEY) as string;
export const REQUEST_HEADERS = {
  apiKey: "x-api-key",
};
export const OBJECT_LIST_TABLE = {
  columnIds: {
    objectType: "__typename",
    displayField: "skylark-ui-display-field",
    checkbox: "skylark-ui-select",
    actions: "skylark-ui-actions",
    availability: "availability",
    images: "images",
  },
};
export const LOCAL_STORAGE = {
  betaAuth: {
    uri: "skylark_beta_uri",
    token: "skylark_beta_auth_token",
  },
  graphiql: {
    theme: "graphiql:theme",
    tabState: "graphiql:tabState",
  },
};
export const HREFS = {
  apiDocs: "https://docs.skylarkplatform.com/",
};
// Helpful way to priorise common display names when one isn't set
export const DISPLAY_NAME_PRIORITY = [
  "title",
  "name",
  "slug",
  "external_id",
  "uid",
];
