import GQLSkylarkGetMovieRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/fantasticMrFox_All_Availabilities.json";
import {
  render,
  screen,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";

import { VideoPlayer } from "./video-player.component";

jest.mock("react-player/lazy", () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="video-player-mock"></div>),
  };
});

test("renders player", async () => {
  const src =
    GQLSkylarkGetMovieRelationshipsQueryFixture.data.getObjectRelationships
      .assets.objects[0].url;

  await render(<VideoPlayer src={src} />);

  await waitFor(() => {
    expect(screen.getByTestId(`video-player-for-${src}`)).toBeInTheDocument();
  });

  const playerContainer = within(screen.getByTestId(`video-player-for-${src}`));

  await waitFor(() => {
    expect(
      playerContainer.getByTestId("video-player-mock"),
    ).toBeInTheDocument();
  });
});
