import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
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
import {
  addCloudinaryOnTheFlyImageTransformation,
  formatObjectField,
} from "src/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

describe("imagery view", () => {
  test("renders the panel", async () => {
    render(
      <Panel {...defaultProps} object={movieObject} tab={PanelTab.Imagery} />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(GQLSkylarkGetObjectQueryFixture.data.getObject.title),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getAllByText(GQLSkylarkGetObjectQueryFixture.data.getObject.title),
    ).toHaveLength(1);
    expect(
      screen.getByText(
        `Title: ${GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].title}`,
      ),
    ).toBeInTheDocument();

    const thumbnailCount =
      GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects.filter(
        ({ type }) => type === "THUMBNAIL",
      ).length;
    expect(
      screen.getByText(
        `${formatObjectField(
          GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].type,
        )} (${thumbnailCount})`,
      ),
    ).toBeInTheDocument();

    const image = screen.getByAltText(
      GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].title,
    );

    expect(image).toHaveAttribute(
      "src",
      addCloudinaryOnTheFlyImageTransformation(
        GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].url,
        {},
      ),
    );
  });

  test("calls setPanelObject with the selected image info when the OpenObjectButton is clicked", async () => {
    const setPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        setPanelObject={setPanelObject}
        tab={PanelTab.Imagery}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(GQLSkylarkGetObjectQueryFixture.data.getObject.title),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getAllByText(GQLSkylarkGetObjectQueryFixture.data.getObject.title),
    ).toHaveLength(1);

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType: "SkylarkImage",
      uid: GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].uid,
      language: "en-GB",
    });
  });
});
