import {
  BuiltInSkylarkObjectType,
  SkylarkObjectType,
  SkylarkSystemField,
} from "src/interfaces/skylark";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
export const SKYLARK_GRAPHQL_URL = (process.env.NEXT_PUBLIC_SKYLARK_API_URL ||
  process.env.SKYLARK_API_URL) as string;
export const SAAS_API_ENDPOINT = (process.env.NEXT_PUBLIC_SAAS_API_ENDPOINT ||
  process.env.SAAS_API_ENDPOINT) as string;
export const SAAS_API_KEY = (process.env.NEXT_PUBLIC_SAAS_API_KEY ||
  process.env.SAAS_API_KEY) as string;
export const REQUEST_HEADERS = {
  apiKey: "Authorization",
  betaApiKey: "x-api-key",
};
export const OBJECT_LIST_TABLE = {
  columnIds: {
    objectType: "__typename",
    displayField: "skylark-ui-display-field",
    checkbox: "skylark-ui-select",
    actions: "skylark-ui-actions",
    availability: "availability",
    images: "images",
    translation: "translation",
  },
};
export const HREFS = {
  relative: {
    graphqlEditor: "/developer/graphql-editor",
  },
  external: {
    apiDocs: "https://docs.skylarkplatform.com/",
  },
};
export const SYSTEM_FIELDS: string[] = [
  SkylarkSystemField.UID,
  SkylarkSystemField.ExternalID,
  SkylarkSystemField.Slug,
  SkylarkSystemField.DataSourceID,
  SkylarkSystemField.DataSourceFields,
];
// Helpful way to priorise common display names when one isn't set
export const DISPLAY_NAME_PRIORITY = [
  "title",
  "name",
  ...SYSTEM_FIELDS.reverse(),
];

export const DROPPABLE_ID = "droppable";
// export const DROPPABLE_RELATIONSHIPS_ID = "droppable-relationships";
export const INPUT_REGEX: Record<string, string | RegExp> = {
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
  // AWSEmail
  email:
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
};

export const OBJECT_OPTIONS: {
  objectTypes: SkylarkObjectType[];
  hiddenFields: string[];
}[] = [
  {
    objectTypes: [
      BuiltInSkylarkObjectType.SkylarkImage,
      BuiltInSkylarkObjectType.BetaSkylarkImage,
    ],
    hiddenFields: ["external_url", "upload_url", "download_from_url"],
  },
];
