import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "src/__tests__/utils/test-utils";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { SearchFilter } from "./searchFilter.component";

const objectTypes = ["Brand", "Season", "Episode"];

const objectTypesWithConfig = objectTypes.map((objectType) => ({
  objectType,
  config: undefined,
}));

const columns = ["uid", "external_id", "slug"];
const columnOpts = columns.map((id) => ({ value: id }));

const graphqlQuery = {
  query: GET_SKYLARK_OBJECT_TYPES,
  variables: {},
  headers: {},
};

test("renders with all checkboxes checked", async () => {
  render(
    <SearchFilter
      searchType={SearchType.Search}
      objectTypesWithConfig={objectTypesWithConfig}
      activeObjectTypes={objectTypes}
      columns={columnOpts}
      visibleColumns={columns}
      onFilterSave={jest.fn()}
      graphqlQuery={graphqlQuery}
    />,
  );

  await screen.findAllByRole("checkbox");

  screen.getAllByRole("checkbox").map((el) => {
    expect(el).toHaveAttribute("aria-checked", "true");
  });
});

test("changes checkboxes and calls onFilterSave when apply is clicked", async () => {
  const onFilterSave = jest.fn();

  render(
    <SearchFilter
      searchType={SearchType.Search}
      objectTypesWithConfig={objectTypesWithConfig}
      activeObjectTypes={objectTypes}
      columns={columnOpts}
      visibleColumns={columns}
      onFilterSave={onFilterSave}
      graphqlQuery={graphqlQuery}
    />,
  );

  await screen.findAllByRole("checkbox");

  const seasonCheckbox = await screen.findByRole("checkbox", {
    name: "Season",
  });
  await fireEvent.click(seasonCheckbox);
  await waitFor(() =>
    expect(seasonCheckbox).toHaveAttribute("aria-checked", "false"),
  );

  const episodeCheckbox = await screen.findByRole("checkbox", {
    name: "Episode",
  });
  await fireEvent.click(episodeCheckbox);
  await waitFor(() =>
    expect(episodeCheckbox).toHaveAttribute("aria-checked", "false"),
  );

  const uidLookup = await screen.findByLabelText("UID & External ID");
  await fireEvent.click(uidLookup);
  await waitFor(() =>
    expect(uidLookup).toHaveAttribute("aria-checked", "true"),
  );

  const slugCheckbox = await screen.findByRole("checkbox", { name: "slug" });
  expect(slugCheckbox).toHaveAttribute("aria-checked", "true");
  await fireEvent.click(slugCheckbox);
  await waitFor(() =>
    expect(slugCheckbox).toHaveAttribute("aria-checked", "false"),
  );

  await fireEvent.click(await screen.findByText("Apply"));

  expect(onFilterSave).toHaveBeenCalledWith({
    filters: { objectTypes: ["Brand"] },
    columnVisibility: {
      external_id: true,
      slug: false,
      uid: true,
    },
    searchType: SearchType.UIDExtIDLookup,
  });
});

test("changes checkboxes and calls onFilterSave when apply is clicked (old column filter - all fields in a single CheckboxGrid)", async () => {
  const onFilterSave = jest.fn();

  render(
    <SearchFilter
      searchType={SearchType.Search}
      objectTypesWithConfig={objectTypesWithConfig}
      activeObjectTypes={objectTypes}
      columns={columnOpts}
      visibleColumns={columns}
      onFilterSave={onFilterSave}
      graphqlQuery={graphqlQuery}
    />,
  );

  await screen.findAllByRole("checkbox");

  const columnFilterSwitch = await screen.findByRole("switch");
  expect(columnFilterSwitch).toHaveAttribute("aria-checked", "true");
  await fireEvent.click(columnFilterSwitch);
  await waitFor(() =>
    expect(columnFilterSwitch).toHaveAttribute("aria-checked", "false"),
  );

  expect(
    screen.queryByText("Separated by Object Type"),
  ).not.toBeInTheDocument();
  expect(screen.getByText("All fields")).toBeInTheDocument();

  const uidLookup = await screen.findByText("UID & External ID");
  await fireEvent.click(uidLookup);

  const seasonCheckbox = await screen.findByRole("checkbox", {
    name: "Season",
  });
  await fireEvent.click(seasonCheckbox);

  const slugCheckbox = await screen.findByRole("checkbox", { name: "slug" });
  await fireEvent.click(slugCheckbox);

  await fireEvent.click(await screen.findByText("Apply"));

  expect(onFilterSave).toHaveBeenCalledWith({
    filters: { objectTypes: ["Brand", "Episode"] },
    columnVisibility: {
      external_id: true,
      slug: false,
      uid: true,
    },
    searchType: SearchType.UIDExtIDLookup,
  });
});

test("when reset is clicked, all filters are returned to their default values", async () => {
  const onFilterSave = jest.fn();

  render(
    <SearchFilter
      searchType={SearchType.Search}
      objectTypesWithConfig={objectTypesWithConfig}
      activeObjectTypes={[]}
      columns={columnOpts}
      visibleColumns={[]}
      onFilterSave={onFilterSave}
      graphqlQuery={graphqlQuery}
    />,
  );

  await screen.findAllByRole("checkbox");

  await fireEvent.click(await screen.findByText("Reset"));

  await fireEvent.click(await screen.findByText("Apply"));

  expect(onFilterSave).toHaveBeenCalledWith({
    filters: { objectTypes: ["Brand", "Season", "Episode"] },
    columnVisibility: {
      external_id: true,
      slug: true,
      uid: true,
    },
    searchType: SearchType.Search,
  });
});
