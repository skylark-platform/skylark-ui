import { print } from "graphql";

import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { HREFS } from "src/constants/skylark";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { DisplayGraphQLQuery } from "./graphQLQueryModal.component";

const label = "Schema";

const variables = {
  variable1: "value1",
};

const headers = {
  header1: "value1",
};

const stringifiedVariables = JSON.stringify(variables);
const stringifiedHeaders = JSON.stringify(headers);
const formattedQuery = print(GET_SKYLARK_OBJECT_TYPES);

const newTab = {
  id: "dynamically-generated-query",
  hash: null,
  operationName: "GET_SKYLARK_OBJECT_TYPES",
  query: formattedQuery,
  response: null,
  title: "GET_SKYLARK_OBJECT_TYPES",
  variables: stringifiedVariables,
  headers: stringifiedHeaders,
};

const newQuery = {
  query: formattedQuery,
  variables: stringifiedVariables,
  headers: stringifiedHeaders,
  operationName: "GET_SKYLARK_OBJECT_TYPES",
};

const queries = [
  {
    query:
      "query GET_Episode($ignoreAvailability: Boolean = true, $uid: String, $externalId: String) {\n  getObject: getEpisode(\n    ignore_availability: $ignoreAvailability\n    uid: $uid\n    external_id: $externalId\n  ) {\n    _config {\n      primary_field\n      colour\n    }\n    _meta {\n      available_languages\n    }\n    uid\n    external_id\n    slug\n    episode_number\n    release_date\n    synopsis_long\n    synopsis_medium\n    synopsis_short\n    title\n    title_long\n    title_medium\n    title_short\n    availability(limit: 50) {\n      next_token\n      objects {\n        uid\n        external_id\n        title\n        slug\n        start\n        end\n        timezone\n      }\n    }\n    images(limit: 50) {\n      next_token\n      objects {\n        uid\n        external_id\n        slug\n        title\n        description\n        type\n        url\n        external_url\n        upload_url\n        download_from_url\n        file_name\n        content_type\n      }\n    }\n  }\n}",
    variables: '{"uid":"01GTZMK7705GJ7HZAM09SGTGGD"}',
    headers: "",
    operationName: "GET_Episode",
  },
  {
    query:
      "query GET_Episode_AVAILABILITY($ignoreAvailability: Boolean = true, $uid: String, $externalId: String, $nextToken: String) {\n  getObjectAvailability: getEpisode(\n    ignore_availability: $ignoreAvailability\n    uid: $uid\n    external_id: $externalId\n  ) {\n    availability(limit: 5, next_token: $nextToken) {\n      next_token\n      objects {\n        uid\n        external_id\n        title\n        slug\n        start\n        end\n        timezone\n        dimensions(limit: 50) {\n          next_token\n          objects {\n            uid\n            title\n            slug\n            external_id\n            description\n            values {\n              objects {\n                description\n                external_id\n                slug\n                title\n                uid\n              }\n              next_token\n            }\n          }\n        }\n      }\n    }\n  }\n}",
    variables: '{"uid":"01GV3NK1N13XKQB9CFEMNH7KP4"}',
    headers: "",
    operationName: "GET_Episode_AVAILABILITY",
  },
];

const tabs = [
  {
    id: "123",
    hash: null,
    headers: null,
    operationName: "GET_Episode",
    query:
      "query GET_Episode($ignoreAvailability: Boolean = true, $uid: String, $externalId: String) {\n  getObject: getEpisode(\n    ignore_availability: $ignoreAvailability\n    uid: $uid\n    external_id: $externalId\n  ) {\n    _config {\n      primary_field\n      colour\n    }\n    _meta {\n      available_languages\n    }\n    uid\n    external_id\n    slug\n    episode_number\n    release_date\n    synopsis_long\n    synopsis_medium\n    synopsis_short\n    title\n    title_long\n    title_medium\n    title_short\n    availability(limit: 50) {\n      next_token\n      objects {\n        uid\n        external_id\n        title\n        slug\n        start\n        end\n        timezone\n      }\n    }\n    images(limit: 50) {\n      next_token\n      objects {\n        uid\n        external_id\n        slug\n        title\n        description\n        type\n        url\n        external_url\n        upload_url\n        download_from_url\n        file_name\n        content_type\n      }\n    }\n  }\n}",
    response: null,
    title: "GET_Episode",
    variables: '{"uid":"01GTZMK4E9NEDEPR5HG4X579ZD"}',
  },
  {
    id: "456",
    hash: null,
    headers: null,
    operationName: "GET_Episode_AVAILABILITY",
    query:
      "query GET_Episode_AVAILABILITY($ignoreAvailability: Boolean = true, $uid: String, $externalId: String, $nextToken: String) {\n  getObjectAvailability: getEpisode(\n    ignore_availability: $ignoreAvailability\n    uid: $uid\n    external_id: $externalId\n  ) {\n    availability(limit: 5, next_token: $nextToken) {\n      next_token\n      objects {\n        uid\n        external_id\n        title\n        slug\n        start\n        end\n        timezone\n        dimensions(limit: 50) {\n          next_token\n          objects {\n            uid\n            title\n            slug\n            external_id\n            description\n            values {\n              objects {\n                description\n                external_id\n                slug\n                title\n                uid\n              }\n              next_token\n            }\n          }\n        }\n      }\n    }\n  }\n}",
    response: null,
    title: "GET_Episode_AVAILABILITY",
    variables: '{"uid":"01GV3NK1N13XKQB9CFEMNH7KP4"}',
  },
];

test("renders the button", () => {
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_OBJECT_TYPES}
      variables={variables}
      headers={headers}
    />,
  );

  expect(screen.queryByRole("button")).toBeInTheDocument();
});

test("opens the modal to the query tab", async () => {
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_OBJECT_TYPES}
      variables={variables}
      headers={headers}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  await screen.findByTestId("syntax-highlighter");
  expect(screen.queryByText("Query for Schema")).toBeInTheDocument();
  expect(screen.queryByText("GET_SKYLARK_OBJECT_TYPES")).toBeTruthy();
  expect(screen.queryByText("value1")).toBeFalsy();
});

test("opens the modal and switches to the variables tab", async () => {
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_OBJECT_TYPES}
      variables={variables}
      headers={headers}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  await screen.findByTestId("syntax-highlighter");
  expect(screen.queryByText("Query for Schema")).toBeInTheDocument();

  await fireEvent.click(screen.getByText("Variables"));

  expect(screen.queryByText("GET_SKYLARK_OBJECT_TYPES")).toBeFalsy();
  expect(screen.queryByText('"value1"')).toBeInTheDocument();
});

test("opens the modal and switches to the headers tab", async () => {
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_OBJECT_TYPES}
      variables={variables}
      headers={headers}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  await screen.findByTestId("syntax-highlighter");
  expect(screen.queryByText("Query for Schema")).toBeInTheDocument();

  await fireEvent.click(screen.getByText("Headers"));

  expect(screen.queryByText("GET_SKYLARK_OBJECT_TYPES")).toBeFalsy();
  expect(screen.queryByText('"header1"')).toBeInTheDocument();
});

test("copies the active tab to the clipboard", async () => {
  jest.spyOn(navigator.clipboard, "writeText");

  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_OBJECT_TYPES}
      variables={variables}
      headers={headers}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  await screen.findByTestId("syntax-highlighter");

  const copyActiveTab = screen.getByTestId("copy-active-tab-to-clipboard");
  fireEvent.click(copyActiveTab);

  expect(navigator.clipboard.writeText).toHaveBeenNthCalledWith(
    1,
    formattedQuery,
  );

  await fireEvent.click(screen.getByText("Variables"));
  fireEvent.click(copyActiveTab);
  expect(navigator.clipboard.writeText).toHaveBeenNthCalledWith(
    2,
    stringifiedVariables,
  );
});

test("clicks the open query in editor button which sets the GraphiQL localStorage when it is not set", async () => {
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.getItem = jest.fn().mockImplementation((key: string) => {
    if (key === LOCAL_STORAGE.graphiql.tabState) {
      // Invalid JSON to test error
      return "{";
    }
    if (key === LOCAL_STORAGE.graphiql.queries) {
      return "";
    }

    return "";
  });
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_OBJECT_TYPES}
      variables={variables}
      headers={headers}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    HREFS.relative.graphqlEditor,
  );

  await fireEvent.click(screen.getByRole("link"));
  expect(localStorage.setItem).toHaveBeenCalledTimes(5);

  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.query,
    formattedQuery,
  );
  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.variables,
    stringifiedVariables,
  );
  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.headers,
    stringifiedHeaders,
  );
  expect(localStorage.setItem).toHaveBeenNthCalledWith(
    4,
    LOCAL_STORAGE.graphiql.tabState,
    JSON.stringify({ tabs: [newTab], activeTabIndex: 0 }),
  );
  expect(localStorage.setItem).toHaveBeenNthCalledWith(
    5,
    LOCAL_STORAGE.graphiql.queries,
    JSON.stringify({ queries: [newQuery] }),
  );
});

test("clicks the open query in editor button which updates the GraphiQL localStorage when it is set", async () => {
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.getItem = jest.fn().mockImplementation((key: string) => {
    if (key === LOCAL_STORAGE.graphiql.tabState) {
      return JSON.stringify({ tabs, activeTabIndex: 0 });
    }
    if (key === LOCAL_STORAGE.graphiql.queries) {
      return JSON.stringify({ queries });
    }

    return "";
  });

  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_OBJECT_TYPES}
      variables={variables}
      headers={headers}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    HREFS.relative.graphqlEditor,
  );

  await fireEvent.click(screen.getByRole("link"));
  expect(localStorage.setItem).toHaveBeenCalledTimes(5);

  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.query,
    formattedQuery,
  );
  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.variables,
    stringifiedVariables,
  );
  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.headers,
    stringifiedHeaders,
  );
  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.queries,
    JSON.stringify({ queries: [...queries, newQuery] }),
  );
  expect(localStorage.setItem).toHaveBeenCalledWith(
    LOCAL_STORAGE.graphiql.tabState,
    JSON.stringify({ tabs: [...tabs, newTab], activeTabIndex: tabs.length }),
  );
});
