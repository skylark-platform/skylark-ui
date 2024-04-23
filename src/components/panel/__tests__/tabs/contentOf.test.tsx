import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetMovieContentOfFixture from "src/__tests__/fixtures/skylark/queries/getObjectContentOf/fantasticMrFox_All_Availabilities.json";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "src/__tests__/utils/test-utils";
import {
  defaultProps,
  movieObject,
} from "src/components/panel/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { PanelTab } from "src/hooks/state";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

describe("appears in (content_of) view", () => {
  test("render the panel", async () => {
    const setPanelObject = jest.fn();

    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.ContentOf}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(GQLSkylarkGetObjectQueryFixture.data.getObject.title),
      ).toBeInTheDocument(),
    );

    const contentOfObjects =
      GQLSkylarkGetMovieContentOfFixture.data.getObjectContentOf.content_of
        .objects;
    const firstContentOfItem = contentOfObjects[0];

    expect((await screen.findAllByText("Setˢˡ")).length).toBeGreaterThanOrEqual(
      1,
    );
    await waitFor(() =>
      expect(
        screen.getByText(firstContentOfItem.__SkylarkSet__title),
      ).toBeInTheDocument(),
    );

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType: firstContentOfItem.__typename,
      uid: firstContentOfItem.uid,
      language: firstContentOfItem._meta.language_data.language,
    });
  });
});
