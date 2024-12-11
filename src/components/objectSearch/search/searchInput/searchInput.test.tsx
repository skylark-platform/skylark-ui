import { act } from "react-dom/test-utils";

import { render, screen, fireEvent } from "src/__tests__/utils/test-utils";
import { SearchType } from "src/hooks/useSearchWithLookupType";

import { SearchInput } from "./searchInput.component";

beforeEach(() => {
  jest.useFakeTimers();
});

test("renders search input with placeholder", async () => {
  render(
    <SearchInput
      searchQuery=""
      searchType={SearchType.Search}
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
      searchType={SearchType.Search}
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
      searchType={SearchType.Search}
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
      searchType={SearchType.Search}
      onQueryChange={jest.fn()}
      toggleFilterOpen={toggleFilterOpen}
      onRefresh={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByLabelText("Open Search Options"));

  expect(toggleFilterOpen).toHaveBeenCalled();
});

test("calls onRefresh when the refresh button is clicked", async () => {
  const refresh = jest.fn();
  render(
    <SearchInput
      searchQuery=""
      searchType={SearchType.Search}
      onQueryChange={jest.fn()}
      toggleFilterOpen={jest.fn()}
      onRefresh={refresh}
    />,
  );

  fireEvent.click(screen.getByTestId("search-refresh"));

  expect(refresh).toHaveBeenCalled();
});

test("can't find/open filters when hideFilters prop is given", async () => {
  render(
    <SearchInput
      searchQuery=""
      searchType={SearchType.Search}
      onQueryChange={jest.fn()}
      toggleFilterOpen={jest.fn()}
      onRefresh={jest.fn()}
      hideFilters
    />,
  );

  expect(
    screen.queryByLabelText("Open Search Options"),
  ).not.toBeInTheDocument();
});
