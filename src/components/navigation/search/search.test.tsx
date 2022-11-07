import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";

import { QuickSearch } from "./search.component";

test("searches for episodes", async () => {
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
