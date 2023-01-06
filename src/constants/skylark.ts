export const SKYLARK_GRAPHQL_URL = (process.env.NEXT_PUBLIC_SKYLARK_API_URL ||
  process.env.SKYLARK_API_URL) as string;
export const SAAS_API_ENDPOINT = (process.env.NEXT_PUBLIC_SAAS_API_ENDPOINT ||
  process.env.SAAS_API_ENDPOINT) as string;
export const SAAS_API_KEY = (process.env.NEXT_PUBLIC_SAAS_API_KEY ||
  process.env.SAAS_API_KEY) as string;
export const OBJECT_LIST_TABLE = {
  columnIds: {
    checkbox: "skylark-ui-select",
    actions: "skylark-ui-actions",
  },
};
