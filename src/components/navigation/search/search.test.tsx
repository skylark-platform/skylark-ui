import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";

import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";

import { QuickSearch } from "./search.component";

test("searches for episodes on click", async () => {
  const search = jest.fn();

  render(<QuickSearch onSearch={search} />);

  const searchInput = screen.getByRole("textbox");
  const searchButton = screen.getByRole("button");

  act(() => {
    fireEvent.change(searchInput, { target: { value: "episodes" } });
    fireEvent.click(searchButton);
  });

  expect(search).toHaveBeenCalledWith("episodes");
});

test("searches for episodes when enter key is pressed", async () => {
  const search = jest.fn();

  render(<QuickSearch onSearch={search} />);

  const searchInput = screen.getByRole("textbox");

  act(() => {
    fireEvent.change(searchInput, { target: { value: "episodes" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: 13, charCode: 13 });
  });

  expect(search).toHaveBeenCalledWith("episodes");
});

test("does not search for episodes when a non-enter key is pressed", async () => {
  const search = jest.fn();

  render(<QuickSearch onSearch={search} />);

  const searchInput = screen.getByRole("textbox");

  act(() => {
    fireEvent.change(searchInput, { target: { value: "episodes" } });
    fireEvent.keyDown(searchInput, { key: "Backspace" });
  });

  expect(search).not.toHaveBeenCalled();
});
