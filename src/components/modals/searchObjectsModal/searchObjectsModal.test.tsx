import GQLGameOfThronesSearchResultsPage1enGB from "src/__tests__/fixtures/skylark/queries/search/gotPage1enGB.json";
import {
  render,
  within,
  waitFor,
  screen,
  fireEvent,
} from "src/__tests__/utils/test-utils";
import {
  AvailabilityStatus,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";

import { SearchObjectsModal } from "./searchObjectsModal.component";

// Mock window size so that the UID column is rendered
window.Element.prototype.getBoundingClientRect = jest
  .fn()
  .mockReturnValue({ height: 4000, width: 4000 });

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
      onSave={jest.fn()}
      columns={["uid"]}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("search-objects-modal")).toBeInTheDocument(),
  );

  await screen.findByText(title);

  await waitFor(() => {
    expect(
      screen.getByTestId("object-search-results-content"),
    ).toBeInTheDocument();
  });

  await screen.findByText("UID"); // Search for table header

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
      onSave={jest.fn()}
      columns={["external_id"]}
    />,
  );

  expect(screen.queryByText("UID")).not.toBeInTheDocument();
});

test("calls onSave with the selected rows", async () => {
  const onSave = jest.fn();

  render(
    <SearchObjectsModal
      title={title}
      isOpen={true}
      closeModal={jest.fn()}
      onSave={onSave}
      columns={["uid"]}
    />,
  );

  await waitFor(() => {
    expect(
      screen.getByTestId("object-search-results-content"),
    ).toBeInTheDocument();
  });

  await screen.findByText("UID"); // Search for table header

  await waitFor(() => {
    expect(
      screen.getByText(
        GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
      ),
    ).toBeInTheDocument();
  });

  fireEvent.click(
    screen.getByText(
      GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
    ),
  );

  fireEvent.click(screen.getByTestId("search-objects-modal-save"));

  expect(onSave).toHaveBeenCalledWith({
    checkedObjectsState: [
      {
        checkedState: true,
        object: expect.objectContaining({
          uid: GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
            .uid,
          objectType:
            GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0]
              .__typename,
        }),
      },
    ],
  });
});

test("existing selected rows are disabled from being checked", async () => {
  const secondEpisode =
    GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[1];
  render(
    <SearchObjectsModal
      title={title}
      isOpen={true}
      closeModal={jest.fn()}
      onSave={jest.fn()}
      columns={["uid"]}
      existingObjects={[
        {
          uid: secondEpisode.uid,
          objectType: secondEpisode.__typename,
          availableLanguages: secondEpisode._meta.available_languages,
          language: secondEpisode._meta.language_data.language,
          availabilityStatus: AvailabilityStatus.Active,
          type: null,
          contextualFields: null,
          externalId: "",
          display: {
            name: secondEpisode.uid,
            objectType: secondEpisode.__typename,
            colour: "",
          },
          created: "",
          modified: "",
        },
      ]}
    />,
  );

  await waitFor(() => {
    expect(
      screen.getByTestId("object-search-results-content"),
    ).toBeInTheDocument();
  });

  await screen.findByText("UID"); // Search for table header

  await waitFor(() => {
    expect(
      screen.getByText(
        GQLGameOfThronesSearchResultsPage1enGB.data.search.objects[0].uid,
      ),
    ).toBeInTheDocument();
  });

  const secondRow = within(
    screen.getAllByTestId("object-search-results-row")[1],
  );
  const checkbox = secondRow.getAllByRole("checkbox")[0];
  expect(checkbox).toBeDisabled();
});
