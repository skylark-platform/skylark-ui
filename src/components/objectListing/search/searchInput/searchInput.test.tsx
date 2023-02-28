import { fireEvent } from "@storybook/testing-library";
import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";

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
    />,
  );

  screen.findByPlaceholderText("Search for an object(s)");

  expect(screen.getByRole("button")).toHaveTextContent("Filters");
});

test("calls onQueryChange when the search query changes", async () => {
  const onQueryChange = jest.fn();
  render(
    <SearchInput
      searchQuery=""
      onQueryChange={onQueryChange}
      toggleFilterOpen={jest.fn()}
    />,
  );

  const input = screen.getByPlaceholderText("Search for an object(s)");
  fireEvent.change(input, { target: { value: "New Search String" } });

  act(() => {
    jest.runAllTimers();
  });

  expect(onQueryChange).toHaveBeenCalledWith("New Search String");
});

test("calls toggleFilterOpen when the filter button is clicked", async () => {
  const toggleFilterOpen = jest.fn();
  render(
    <SearchInput
      searchQuery=""
      onQueryChange={jest.fn()}
      toggleFilterOpen={toggleFilterOpen}
    />,
  );

  fireEvent.click(screen.getByRole("button"));

  expect(toggleFilterOpen).toHaveBeenCalled();
});
