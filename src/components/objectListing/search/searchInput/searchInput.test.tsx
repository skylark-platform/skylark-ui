import { fireEvent } from "@storybook/testing-library";
import { act } from "react-dom/test-utils";

import { render, screen } from "src/__tests__/utils/test-utils";

import { SearchInput } from "./searchInput.component";

beforeEach(() => {
  jest.useFakeTimers();
});

test("renders search input with placeholder", async () => {
  render(
    <SearchInput
      searchQuery=""
      onQueryChange={jest.fn()}
      toggleFilterOpen={jest.fn()}
      onRefresh={jest.fn()}
    />,
  );

  expect(
    screen.getByPlaceholderText("Search for an object(s)"),
  ).toBeInTheDocument();
});

test("calls onQueryChange when the search query changes", async () => {
  const onQueryChange = jest.fn();
  render(
    <SearchInput
      searchQuery=""
      onQueryChange={onQueryChange}
      toggleFilterOpen={jest.fn()}
      onRefresh={jest.fn()}
    />,
  );

  const input = screen.getByPlaceholderText("Search for an object(s)");
  fireEvent.change(input, { target: { value: "New Search String" } });

  act(() => {
    jest.runAllTimers();
  });

  expect(onQueryChange).toHaveBeenCalledWith("New Search String");
});

test("calls onQueryChange with an empty string when the search query is cleared", async () => {
  const onQueryChange = jest.fn();
  render(
    <SearchInput
      searchQuery="searchquery"
      onQueryChange={onQueryChange}
      toggleFilterOpen={jest.fn()}
      onRefresh={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByTestId("search-clear-query"));

  act(() => {
    jest.runAllTimers();
  });

  expect(onQueryChange).toHaveBeenCalledWith("");
});

test("calls toggleFilterOpen when the filter button is clicked", async () => {
  const toggleFilterOpen = jest.fn();
  render(
    <SearchInput
      searchQuery=""
      onQueryChange={jest.fn()}
      toggleFilterOpen={toggleFilterOpen}
      onRefresh={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByLabelText("open-search-filters"));

  expect(toggleFilterOpen).toHaveBeenCalled();
});

test("calls onRefresh when the refresh button is clicked", async () => {
  const refresh = jest.fn();
  render(
    <SearchInput
      searchQuery=""
      onQueryChange={jest.fn()}
      toggleFilterOpen={jest.fn()}
      onRefresh={refresh}
    />,
  );

  fireEvent.click(screen.getByTestId("search-refresh"));

  expect(refresh).toHaveBeenCalled();
});
