export const FLATFILE_GRAPHQL_URL = "https://api.us.flatfile.io/graphql";
export const FLATFILE_TEAM = process.env.FLATFILE_TEAM_ID as string;
export const FLATFILE_ACCESS_KEY_ID = process.env
  .FLATFILE_ACCESS_KEY_ID as string;
export const FLATFILE_SECRET_KEY = process.env.FLATFILE_SECRET_KEY as string;
export const FLATFILE_ENVS = {
  PROD: "64c7b20f-9d95-41ba-a582-e811f37dc619",
  TEST: "d3b7a781-b741-4b82-b028-10cc03321f85",
};
export const ACTIVE_FLATFILE_ENV =
  process.env.VERCEL_ENV === "production"
    ? FLATFILE_ENVS.PROD
    : FLATFILE_ENVS.TEST;
export const FLATFILE_ORG = {
  id: process.env.FLATFILE_TEAM_ID as string,
  name: "Skylark",
};
// Fields in Skylark that shouldn't show in the import flow
export const TEMPLATE_FIELDS_TO_IGNORE = [
  "data_source_id",
  "data_source_fields",
];
