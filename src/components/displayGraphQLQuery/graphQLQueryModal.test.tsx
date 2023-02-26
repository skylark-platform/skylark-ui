import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";

import { DisplayGraphQLQuery } from "./graphQLQueryModal.component";

const label = "Schema";

const variables = {
  variable1: "value1",
};

beforeEach(() => {
  // IntersectionObserver isn't available in test environment
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
});

test("renders the button", () => {
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_SCHEMA}
      variables={variables}
    />,
  );

  expect(screen.queryByRole("button")).toBeInTheDocument();
});

test("opens the modal to the query tab", async () => {
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_SCHEMA}
      variables={variables}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  await screen.findByTestId("syntax-highlighter");
  expect(screen.queryByText("Query for Schema")).toBeInTheDocument();
  expect(screen.queryByText("GET_SKYLARK_SCHEMA")).toBeTruthy();
  expect(screen.queryByText("value1")).toBeFalsy();
});

test("opens the modal and switches to the variables tab", async () => {
  render(
    <DisplayGraphQLQuery
      label={label}
      query={GET_SKYLARK_SCHEMA}
      variables={variables}
    />,
  );

  await fireEvent.click(screen.getByRole("button"));

  await screen.findByTestId("syntax-highlighter");
  expect(screen.queryByText("Query for Schema")).toBeInTheDocument();

  await fireEvent.click(screen.getByText("Variables"));

  expect(screen.queryByText("GET_SKYLARK_SCHEMA")).toBeFalsy();
  expect(screen.queryByText('"value1"')).toBeInTheDocument();
});
