import { fireEvent } from "@storybook/testing-library";

import { render, screen } from "src/__tests__/utils/test-utils";

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
    />,
  );

  await screen.findAllByRole("checkbox");

  screen.getAllByRole("checkbox").map((el) => {
    expect(el).toHaveAttribute("aria-checked", "true");
  });
});

test("calls onFilterSave when apply is clicked", async () => {
  const onFilterSave = jest.fn();

  render(
    <SearchFilter
      objectTypes={objectTypes}
      activeFilters={{ objectTypes }}
      columns={columns}
      visibleColumns={columns}
      onFilterSave={onFilterSave}
    />,
  );

  await screen.findAllByRole("checkbox");

  fireEvent.click(screen.getByText("Apply"));

  expect(onFilterSave).toHaveBeenCalledWith(
    { objectTypes },
    { external_id: true, slug: true, uid: true },
  );
});

test("when reset is clicked, all filters are returned to all options checked without saving", async () => {
  const onFilterSave = jest.fn();

  render(
    <SearchFilter
      objectTypes={objectTypes}
      activeFilters={{ objectTypes: [] }}
      columns={columns}
      visibleColumns={[]}
      onFilterSave={onFilterSave}
    />,
  );

  await screen.findAllByRole("checkbox");

  fireEvent.click(screen.getByText("Reset"));

  screen.getAllByRole("checkbox").map((el) => {
    expect(el).toHaveAttribute("aria-checked", "true");
  });
  expect(onFilterSave).not.toHaveBeenCalled();
});
