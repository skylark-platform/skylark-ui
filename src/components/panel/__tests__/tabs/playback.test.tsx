import GQLSkylarkGetMovieQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetAssetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/skylarkAsset.json";
import GQLSkylarkGetMovieRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/fantasticMrFox_All_Availabilities.json";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "src/__tests__/utils/test-utils";
import {
  defaultProps,
  movieObject,
  skylarkAssetObject,
} from "src/components/panel/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { PanelTab } from "src/hooks/state";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

jest.mock("react-player/lazy", () => {
  return {
    __esModule: true,
    default: jest.fn(() => <></>),
  };
});

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

describe("playback view", () => {
  test("renders the playback tab for a SkylarkAsset", async () => {
    render(
      <Panel
        {...defaultProps}
        object={skylarkAssetObject}
        tab={PanelTab.Playback}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetAssetQueryFixture.data.getObject.internal_title,
        ),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getAllByText(
        GQLSkylarkGetAssetQueryFixture.data.getObject.internal_title,
      ),
    ).toHaveLength(1);

    expect(
      screen.getAllByText(GQLSkylarkGetAssetQueryFixture.data.getObject.url),
    ).toHaveLength(1);

    expect(screen.getByText("HLS")).toBeInTheDocument();
    expect(screen.getByText("DASH")).toBeInTheDocument();
    expect(screen.getByText("EXTERNAL")).toBeInTheDocument();

    const videoPlayer = screen.getByTestId(
      `video-player-for-${GQLSkylarkGetMovieRelationshipsQueryFixture.data.getObjectRelationships.assets.objects[0].url}`,
    );

    expect(videoPlayer).toBeInTheDocument();
  });

  test("renders the playback tab for an object with relationships to SkylarkAsset", async () => {
    render(
      <Panel {...defaultProps} object={movieObject} tab={PanelTab.Playback} />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(GQLSkylarkGetMovieQueryFixture.data.getObject.title),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getAllByText(GQLSkylarkGetMovieQueryFixture.data.getObject.title),
    ).toHaveLength(1);

    await waitFor(() => {
      expect(
        screen.getByText(
          GQLSkylarkGetMovieRelationshipsQueryFixture.data
            .getObjectRelationships.assets.objects[0].internal_title,
        ),
      ).toBeInTheDocument();
    });

    const videoPlayer = screen.getByTestId(
      `video-player-for-${GQLSkylarkGetMovieRelationshipsQueryFixture.data.getObjectRelationships.assets.objects[0].url}`,
    );

    expect(videoPlayer).toBeInTheDocument();
  });

  test("calls setPanelObject with the selected image info when the OpenObjectButton is clicked", async () => {
    const setPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        setPanelObject={setPanelObject}
        tab={PanelTab.Playback}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(GQLSkylarkGetMovieQueryFixture.data.getObject.title),
      ).toBeInTheDocument(),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          GQLSkylarkGetMovieRelationshipsQueryFixture.data
            .getObjectRelationships.assets.objects[0].internal_title,
        ),
      ).toBeInTheDocument();
    });

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: "Open Object",
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectType: "SkylarkAsset",
        uid: GQLSkylarkGetMovieRelationshipsQueryFixture.data
          .getObjectRelationships.assets.objects[0].uid,
        language: "en-GB",
      }),
      { tab: PanelTab.Playback },
    );
  });
});
