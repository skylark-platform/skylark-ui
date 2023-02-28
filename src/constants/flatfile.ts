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

export const TEMPLATE_REGEX = {
  // Skylark uses built in Appsync GraphQL Scalars from: https://docs.aws.amazon.com/appsync/latest/devguide/scalars.html
  // These regex's validate Flatfile inputs to ensure they match the GraphQL formats so we don't cause API errors
  // AWSURL: RFC-1378
  // This regex is based on https://www.regextester.com/104034 but improved to support accented characters
  // Finally, the regex has been JSON escaped for the Flatfile API https://www.freeformatter.com/json-escape.html
  url: "https?:\\/\\/(www\\.)?[-A-z\u00C0-\u00FF0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-A-z\u00C0-\u00FF0-9@:%_\\+.~#()?&//=]*)",
  // AWSIPAddress
  // Supports IPv4 and IPv6 both without the additional /subnet. It will need to be improved to support that
  ipaddress:
    "((^\\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\\s*$)|(^\\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))(%.+)?\\s*$))",
};
