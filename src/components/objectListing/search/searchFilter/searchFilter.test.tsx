import { fireEvent } from "@storybook/testing-library";
import { render, screen } from "@testing-library/react";

import { SearchFilter } from "./searchFilter.component";

const objectTypes = ["Brand", "Season", "Episode"];
const columns = ["uid", "external_id", "slug"];

test("renders with all checkboxes checked", async () => {
  render(
    <SearchFilter
      objectTypes={objectTypes}
      activeFilters={{ objectTypes }}
      columns={columns}
      visibleColumns={columns}
      onFilterSave={jest.fn()}
      closeFilterDiv={jest.fn()}
      setColumnVisibility={jest.fn()}
    />,
  );

  await screen.findAllByRole("checkbox");

  screen.getAllByRole("checkbox").map((el) => {
    expect(el).toHaveAttribute("aria-checked", "true");
  });
});

test("calls onFilterSave when apply is clicked", async () => {
  const onFilterSave = jest.fn();
  const closeFilterDiv = jest.fn();
  const setColumnVisibility = jest.fn();

  render(
    <SearchFilter
      objectTypes={objectTypes}
      activeFilters={{ objectTypes }}
      columns={columns}
      visibleColumns={columns}
      onFilterSave={onFilterSave}
      closeFilterDiv={closeFilterDiv}
      setColumnVisibility={setColumnVisibility}
    />,
  );

  await screen.findAllByRole("checkbox");

  fireEvent.click(screen.getByText("Apply"));

  expect(closeFilterDiv).toHaveBeenCalled();
  expect(onFilterSave).toHaveBeenCalledWith({ objectTypes });
  expect(setColumnVisibility).toHaveBeenCalledWith({
    external_id: true,
    slug: true,
    uid: true,
  });
});

test("when reset is clicked, all filters are returned to all options checked", async () => {
  const onFilterSave = jest.fn();
  const closeFilterDiv = jest.fn();
  const setColumnVisibility = jest.fn();

  render(
    <SearchFilter
      objectTypes={objectTypes}
      activeFilters={{ objectTypes: [] }}
      columns={columns}
      visibleColumns={[]}
      onFilterSave={onFilterSave}
      closeFilterDiv={closeFilterDiv}
      setColumnVisibility={setColumnVisibility}
    />,
  );

  await screen.findAllByRole("checkbox");

  fireEvent.click(screen.getByText("Reset"));

  expect(closeFilterDiv).toHaveBeenCalled();
  expect(onFilterSave).toHaveBeenCalledWith({ objectTypes });
  expect(setColumnVisibility).toHaveBeenCalledWith({
    external_id: true,
    slug: true,
    uid: true,
  });
});
