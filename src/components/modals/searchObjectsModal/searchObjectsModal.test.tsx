import { waitFor, screen, fireEvent } from "@testing-library/react";

import GQLGameOfThronesSearchResultsPage1enGB from "src/__tests__/fixtures/skylark/queries/search/gotPage1enGB.json";
import { render } from "src/__tests__/utils/test-utils";

import { SearchObjectsModal } from "./searchObjectsModal.component";

const title = "Select Relationships";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

test("renders the modal", async () => {
  render(
    <SearchObjectsModal
      title={title}
      isOpen={true}
      closeModal={jest.fn()}
      onModalClose={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("search-objects-modal")).toBeInTheDocument(),
  );

  await screen.findByText(title);

  await screen.findByText("UID"); // Search for table header
  await waitFor(() => {
    expect(
      screen.getByTestId("object-search-results-content"),
    ).toBeInTheDocument();
  });
  // Search for table content
  await screen.findAllByText(
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
  );
});

test("does not render the UID column when it isn't given in columns", async () => {
  render(
    <SearchObjectsModal
      title={title}
      isOpen={true}
      closeModal={jest.fn()}
      onModalClose={jest.fn()}
      columns={["external_id"]}
    />,
  );

  expect(screen.queryByText("UID")).not.toBeInTheDocument();
});

test("calls onModalClose with the selected rows", async () => {
  const onModalClose = jest.fn();

  render(
    <SearchObjectsModal
      title={title}
      isOpen={true}
      closeModal={jest.fn()}
      onModalClose={onModalClose}
    />,
  );

  await screen.findByText("UID"); // Search for table header
  await waitFor(() => {
    expect(
      screen.getByTestId("object-search-results-content"),
    ).toBeInTheDocument();
  });

  fireEvent.click(
    screen
      .getByText(
        GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
      )
      .closest("tr") as Element,
  );

  fireEvent.click(
    screen
      .getByText(
        GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[2].uid,
      )
      .closest("tr") as Element,
  );

  fireEvent.click(screen.getByTestId("search-objects-modal-save"));

  expect(onModalClose).toHaveBeenCalledWith({
    checkedObjects: [
      expect.objectContaining({
        uid: GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
        objectType:
          GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
            .__typename,
      }),
      expect.objectContaining({
        uid: GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[2].uid,
        objectType:
          GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[2]
            .__typename,
      }),
    ],
  });
});
