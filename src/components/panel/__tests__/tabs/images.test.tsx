import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/fantasticMrFox_All_Availabilities.json";
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

    await waitFor(() => {
      expect(
        screen.getByText(
          GQLSkylarkGetObjectRelationshipsQueryFixture.data
            .getObjectRelationships.images.objects[0].title,
        ),
      ).toBeInTheDocument();
    });

    const thumbnailCount =
      GQLSkylarkGetObjectRelationshipsQueryFixture.data.getObjectRelationships.images.objects.filter(
        ({ type }) => type === "THUMBNAIL",
      ).length;
    expect(
      screen.getByText(
        `${formatObjectField(
          GQLSkylarkGetObjectRelationshipsQueryFixture.data
            .getObjectRelationships.images.objects[0].type,
        )} (${thumbnailCount})`,
      ),
    ).toBeInTheDocument();

    const image = screen.getByAltText(
      GQLSkylarkGetObjectRelationshipsQueryFixture.data.getObjectRelationships
        .images.objects[0].title,
    );

    expect(image).toHaveAttribute(
      "src",
      addCloudinaryOnTheFlyImageTransformation(
        GQLSkylarkGetObjectRelationshipsQueryFixture.data.getObjectRelationships
          .images.objects[0].url,
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

    await waitFor(() => {
      expect(
        screen.getByText(
          GQLSkylarkGetObjectRelationshipsQueryFixture.data
            .getObjectRelationships.images.objects[0].title,
        ),
      ).toBeInTheDocument();
    });

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: "Open Object",
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectType: "SkylarkImage",
        uid: GQLSkylarkGetObjectRelationshipsQueryFixture.data
          .getObjectRelationships.images.objects[0].uid,
        language: "en-GB",
      }),
    );
  });
});
