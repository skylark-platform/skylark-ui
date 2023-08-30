import {
  DefaultBodyType,
  GraphQLContext,
  MockedRequest,
  ResponseResolver,
  graphql,
} from "msw";
import { useState } from "react";

import GQLSkylarkGetAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01ptPT.json";
import GQLSkylarkGetSeasonWithRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import GQLSkylarkGetObjectAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetHomepageSetContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectContent/homepage.json";
import GQLSkylarkGetMovieContentOfFixture from "src/__tests__/fixtures/skylark/queries/getObjectContentOf/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetSeasonRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/gots04relationships.json";
import GQLSkylarkListAvailabilityDimensionsQueryFixture from "src/__tests__/fixtures/skylark/queries/listDimensions.json";
import { server } from "src/__tests__/mocks/server";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "src/__tests__/utils/test-utils";
import { QueryErrorMessages } from "src/enums/graphql";
import { PanelTab } from "src/hooks/state";
import {
  AvailabilityStatus,
  BuiltInSkylarkObjectType,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import {
  createGetObjectAvailabilityQueryName,
  createGetObjectQueryName,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  formatReadableDate,
  getRelativeTimeFromDate,
} from "src/lib/skylark/availability";
import {
  addCloudinaryOnTheFlyImageTransformation,
  formatObjectField,
} from "src/lib/utils";

import { Panel } from "./panel.component";

const movieObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
  objectType: "Movie",
  language:
    GQLSkylarkGetObjectQueryFixture.data.getObject._meta.language_data.language,
};

const imageObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid,
  objectType: "SkylarkImage",
  language: "en-GB",
};

const episodeObjectEnGB: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid,
  objectType: "Episode",
  language: "en-GB",
};

const episodeObjectPtPT: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture.data.getObject.uid,
  objectType: "Episode",
  language: "pt-PT",
};

const setObjectWithContent: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid,
  objectType: "SkylarkSet",
  language: "en-GB",
};

const seasonWithRelationships: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.uid,
  objectType: "Season",
  language: "en-GB",
};

const availabilityObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid,
  objectType: BuiltInSkylarkObjectType.Availability,
  language: "",
};

const defaultProps = {
  closePanel: jest.fn(),
  setPanelObject: jest.fn(),
  setTab: jest.fn(),
  tab: PanelTab.Metadata,
};

const saveGraphQLError: ResponseResolver<
  MockedRequest<DefaultBodyType>,
  GraphQLContext<Record<string, unknown>>
> = (_, res, ctx) => {
  return res(ctx.errors([{ errorType: "error", message: "invalid input" }]));
};

const validateErrorToastShown = async () => {
  await waitFor(() => expect(screen.getByTestId("toast")).toBeInTheDocument());
  const withinToast = within(screen.getByTestId("toast"));
  expect(withinToast.getByText("Error saving changes")).toBeInTheDocument();
  expect(withinToast.getByText("Reason(s):")).toBeInTheDocument();
  expect(withinToast.getByText("- invalid input")).toBeInTheDocument();
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

describe("header (tab independent)", () => {
  test("closing the panel using close button", async () => {
    const closePanel = jest.fn();
    render(
      <Panel {...defaultProps} object={movieObject} closePanel={closePanel} />,
    );

    await waitFor(() => expect(screen.getByText("Close")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Close"));

    expect(closePanel).toHaveBeenCalled();
  });

  test("switches to another tab", async () => {
    const setTab = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Metadata}
        setTab={setTab}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Content")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Content"));

    expect(setTab).toHaveBeenCalledWith("Content");
  });

  test("navigates to previous object using the arrows", () => {
    const navigateToPreviousPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Metadata}
        navigateToPreviousPanelObject={navigateToPreviousPanelObject}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Click to go back/i,
      }),
    );

    expect(navigateToPreviousPanelObject).toHaveBeenCalled();
  });

  test("navigates to next object using the arrows", () => {
    const navigateToForwardPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Metadata}
        navigateToForwardPanelObject={navigateToForwardPanelObject}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Click to go forward/i,
      }),
    );

    expect(navigateToForwardPanelObject).toHaveBeenCalled();
  });

  test("hides the previous object and external open object buttons when isPage is true", async () => {
    render(<Panel {...defaultProps} isPage object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    expect(
      screen.queryAllByRole("button", {
        name: /Click to go back/i,
      }),
    ).toHaveLength(0);

    const panelHeader = within(screen.getByTestId("panel-header"));
    expect(panelHeader.queryAllByRole("link")).toHaveLength(0);
  });

  test("cancel/exit edit view", async () => {
    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Edit Metadata"));

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByText("Editing")).not.toBeInTheDocument();
  });

  test("cancel/exit edit view using the escape key", async () => {
    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Edit Metadata"));

    fireEvent.keyDown(screen.getByTestId("panel-header"), {
      key: "Escape",
      code: "Escape",
    });

    expect(screen.queryByText("Editing")).not.toBeInTheDocument();
  });

  test("save using the ctrl+s hotkey key", async () => {
    render(<Panel {...defaultProps} object={setObjectWithContent} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Edit Metadata"));

    await fireEvent.keyDown(screen.getByTestId("panel-header"), {
      key: "s",
      code: "s",
      ctrlKey: true,
    });

    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Editing")).not.toBeInTheDocument();
  });
});

describe("metadata view", () => {
  test("renders the panel in the default view", async () => {
    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).toBeInTheDocument(),
    );
    await waitFor(
      () => expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
      // First load can be a bit slow due to the number of requests it makes. In production these requests are client side cached
      { timeout: 2000 },
    );
    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());

    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText("Title short")).toHaveValue(
        GQLSkylarkGetObjectQueryFixture.data.getObject.title_short,
      ),
    );
  });

  test("renders three sections system, translatable, global", async () => {
    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    expect(screen.getByText("System Metadata")).toBeInTheDocument();
    expect(screen.getByText("Translatable Metadata")).toBeInTheDocument();
    expect(screen.getByText("Global Metadata")).toBeInTheDocument();
  });

  test("renders the side menu when isPage is true", async () => {
    render(<Panel {...defaultProps} isPage object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("panel-page-side-navigation"),
      ).toBeInTheDocument(),
    );

    const withinPanelPageSideNavigation = within(
      screen.getByTestId("panel-page-side-navigation"),
    );
    expect(
      withinPanelPageSideNavigation.getByText("System Metadata"),
    ).toBeInTheDocument();
    expect(
      withinPanelPageSideNavigation.getByText("Translatable Metadata"),
    ).toBeInTheDocument();
    expect(
      withinPanelPageSideNavigation.getByText("Global Metadata"),
    ).toBeInTheDocument();
  });

  test("renders object not found when the object doesn't exist", async () => {
    server.use(
      graphql.query(createGetObjectQueryName("Movie"), (req, res, ctx) => {
        return res(
          ctx.errors([
            { errorType: QueryErrorMessages.NotFound, message: "Not found" },
          ]),
        );
      }),
    );

    render(
      <Panel
        {...defaultProps}
        object={{ ...movieObject, uid: "nonexistant" }}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(
        screen.getByText('Movie "nonexistant" not found'),
      ).toBeInTheDocument(),
    );
  });

  test("renders object type not found when the object type isn't found in the schema", async () => {
    render(
      <Panel
        {...defaultProps}
        object={{ uid: "123", objectType: "nonexistant", language: "" }}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    expect(
      screen.getByText('Object Type "nonexistant" not found'),
    ).toBeInTheDocument();
  });

  test("renders an error message when an unknown error occurs", async () => {
    server.use(
      graphql.query(createGetObjectQueryName("Movie"), (req, res, ctx) => {
        return res(ctx.errors([{ message: "Something went wrong" }]));
      }),
    );

    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByText("Something went wrong")).toBeInTheDocument(),
    );
  });

  test("renders the objects primaryField and colour in the header when given", async () => {
    const withPrimaryFieldMock = {
      getObject: {
        ...GQLSkylarkGetObjectQueryFixture.data.getObject,
        uid: "withPrimaryField",
        _config: {
          ...GQLSkylarkGetObjectQueryFixture.data.getObject._config,
          primary_field: "release_date",
        },
      },
    };

    server.use(
      graphql.query(createGetObjectQueryName("Movie"), (req, res, ctx) => {
        return res(ctx.data(withPrimaryFieldMock));
      }),
    );

    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());

    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText("Title short")).toHaveValue(
        GQLSkylarkGetObjectQueryFixture.data.getObject.title_short,
      ),
    );
    const panelHeader = within(screen.getByTestId("panel-header"));
    expect(
      panelHeader.getByText(withPrimaryFieldMock.getObject.release_date),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        panelHeader
          .getByText(withPrimaryFieldMock.getObject.__typename)
          .closest("div"),
      ).toHaveAttribute("style", "background-color: rgb(0, 150, 136);"); // Movie HEX in RGB
    });
  });

  test("renders an image and the original image size when the object type is an Image", async () => {
    render(<Panel {...defaultProps} object={imageObject} />);

    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());

    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    expect(screen.getByText("Original size")).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByAltText(
          GQLSkylarkGetObjectImageQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );
  });

  describe("multiple language versions", () => {
    test("renders the Portuguese GOT episode", async () => {
      render(<Panel {...defaultProps} object={episodeObjectPtPT} />);

      await waitFor(() =>
        expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(screen.getByText("Title short")).toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toHaveValue(
          GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture.data.getObject
            .title_short,
        ),
      );
    });

    test("changes the panel language using the dropdown when more than one is available", async () => {
      const SetObjectWrapper = () => {
        const [object, setObject] = useState(episodeObjectEnGB);
        return (
          <Panel {...defaultProps} object={object} setPanelObject={setObject} />
        );
      };
      render(<SetObjectWrapper />);

      // Arrange
      await waitFor(() =>
        expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(screen.getByText("Title short")).toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toHaveValue(
          GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.title_short,
        ),
      );

      // Act
      const dropdown = screen.getByText(
        GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject._meta
          .language_data.language,
      );
      await fireEvent.click(dropdown);
      await fireEvent.click(screen.getByText("pt-PT"));

      // Assert
      await waitFor(() =>
        expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getByText("Title short")).toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toHaveValue(
          GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture.data.getObject
            .title_short,
        ),
      );
    });
  });

  describe("metadata view - edit", () => {
    test("switch into edit mode using the edit metadata button", async () => {
      render(<Panel {...defaultProps} object={setObjectWithContent} />);

      await waitFor(() =>
        expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText("Edit Metadata"));

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );
    });

    test("switch into edit mode by changing an input field", async () => {
      const { user } = render(
        <Panel {...defaultProps} object={setObjectWithContent} />,
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toBeInTheDocument(),
      );

      const input = screen.getByLabelText("Title short");

      await user.type(input, "changed");

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );
    });

    test("edits and cancels to revert a field to its initial value", async () => {
      const { user } = render(
        <Panel {...defaultProps} object={setObjectWithContent} />,
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toBeInTheDocument(),
      );

      const input = screen.getByLabelText("Title short");

      await waitFor(() => {
        expect(input).toHaveValue(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title_short,
        );
      });

      await user.click(input);
      await user.clear(input);
      await user.type(input, "changed");

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      expect(input).toHaveValue("changed");

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(input).toHaveValue(
        GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title_short,
      );
    });

    test("edits and saves", async () => {
      const changedValue = "this has changed";

      server.use(
        graphql.mutation(
          "UPDATE_OBJECT_METADATA_SkylarkSet",
          (req, res, ctx) => {
            return res(
              ctx.data({
                updateObjectMetadata: {
                  ...GQLSkylarkGetHomepageSetQueryFixture.data.getObject,
                  title_short: changedValue,
                },
              }),
            );
          },
        ),
      );

      const { user } = render(
        <Panel {...defaultProps} object={setObjectWithContent} />,
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toBeInTheDocument(),
      );

      const input = screen.getByLabelText("Title short");

      await waitFor(() => {
        expect(input).toHaveValue(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title_short,
        );
      });

      await user.click(input);
      await user.clear(input);
      await user.type(input, changedValue);

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() =>
        expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
      );

      expect(input).toHaveValue(changedValue);
    });

    test("does not exit edit mode when the update mutation fails", async () => {
      server.use(
        graphql.mutation("UPDATE_OBJECT_METADATA_SkylarkSet", saveGraphQLError),
      );

      const { user } = render(
        <Panel {...defaultProps} object={setObjectWithContent} />,
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toBeInTheDocument(),
      );

      const input = screen.getByLabelText("Title short");

      await waitFor(() => {
        expect(input).toHaveValue(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title_short,
        );
      });

      await user.clear(input);
      await user.type(input, "changed");

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      const saveButton = screen.getByText("Save");
      await fireEvent.click(saveButton);

      await validateErrorToastShown();

      await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());

      await waitFor(() =>
        expect(screen.queryAllByText("Edit Metadata")).toHaveLength(0),
      );
    });
  });
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

describe("relationships view", () => {
  test("render the panel", async () => {
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(3));

    expect(
      screen.getByTestId("expand-relationship-episodes"),
    ).toHaveTextContent("Show more");

    fireEvent.click(screen.getByTestId("expand-relationship-episodes"));

    expect(
      screen.getByTestId("expand-relationship-episodes"),
    ).toHaveTextContent("Show less");

    await waitFor(() =>
      expect(screen.getAllByText("Episode")).toHaveLength(10),
    );
  });

  test("edit view", async () => {
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(3));

    fireEvent.click(screen.getByText("Edit Relationships"));

    await waitFor(() =>
      expect(screen.getByText("Editing")).toBeInTheDocument(),
    );
  });

  test("calls setPanelObject with the selected relationship info when the OpenObjectButton is clicked", async () => {
    const setPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(3));

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType: "Brand",
      uid: "01H4MMDGADSP73B3MBM89VZTQC",
      language: "en-GB",
    });
  });

  describe("relationships view - edit", () => {
    const renderAndSwitchToEditView = async () => {
      render(
        <Panel
          {...defaultProps}
          object={seasonWithRelationships}
          tab={PanelTab.Relationships}
        />,
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject
              .title,
          ),
        ).toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getAllByText("Episode")).toHaveLength(3),
      );

      fireEvent.click(screen.getByText("Edit Relationships"));

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );
    };

    test("removes an item from the relationship list", async () => {
      await renderAndSwitchToEditView();

      expect(
        screen.getByTestId("panel-relationship-episodes-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSeasonRelationshipsQueryFixture.data.getObjectRelationships
          .episodes.objects[0].title as string,
      );

      const withinPanelObjectRelationshipItem1 = within(
        screen.getByTestId("panel-relationship-episodes-item-1"),
      );
      const removeButton = withinPanelObjectRelationshipItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      expect(
        screen.getByTestId("panel-relationship-episodes-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSeasonRelationshipsQueryFixture.data.getObjectRelationships
          .episodes.objects[1].title as string,
      );
    });

    test("removes an item and saves", async () => {
      await renderAndSwitchToEditView();

      const withinPanelObjectRelationshipItem1 = within(
        screen.getByTestId("panel-relationship-episodes-item-1"),
      );
      const removeButton = withinPanelObjectRelationshipItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() =>
        expect(screen.queryByText("Editing")).not.toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getByText("Edit Relationships")).toBeInTheDocument(),
      );
    });

    test("removes an item, saves but GraphQL returns an error", async () => {
      server.use(
        graphql.mutation(
          "UPDATE_OBJECT_RELATIONSHIPS_Season",
          saveGraphQLError,
        ),
      );

      await renderAndSwitchToEditView();

      const withinPanelObjectRelationshipItem1 = within(
        screen.getByTestId("panel-relationship-episodes-item-1"),
      );
      const removeButton = withinPanelObjectRelationshipItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await validateErrorToastShown();

      await waitFor(() =>
        expect(screen.queryByText("Editing")).toBeInTheDocument(),
      );
    });
  });
});

describe("content view", () => {
  test("render the panel", async () => {
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Content}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getAllByText("Homepage")).toHaveLength(1);

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
            .content.objects[0].object?.__SkylarkSet__title as string,
        ),
      ).toBeInTheDocument(),
    );
  });

  test("edit view", async () => {
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Content}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getAllByText("Homepage")).toHaveLength(1);

    fireEvent.click(screen.getByText("Edit Content"));

    await waitFor(() =>
      expect(screen.getByText("Editing")).toBeInTheDocument(),
    );
  });

  test("calls setPanelObject with the selected content info when the OpenObjectButton is clicked", async () => {
    const setPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Content}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getAllByText("Homepage")).toHaveLength(1);

    const firstContentItemTitle = GQLSkylarkGetHomepageSetContentQueryFixture
      .data.getObjectContent.content.objects[0].object
      .__SkylarkSet__title as string;
    await waitFor(() =>
      expect(screen.getByText(firstContentItemTitle)).toBeInTheDocument(),
    );

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType:
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__typename,
      uid: GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
        .content.objects[0].object.uid,
      language: "en-GB",
    });
  });

  describe("content view - edit", () => {
    const renderAndSwitchToEditView = async () => {
      render(
        <Panel
          {...defaultProps}
          object={setObjectWithContent}
          tab={PanelTab.Content}
        />,
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
          ),
        ).toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getAllByText("Homepage")).toHaveLength(1),
      );

      fireEvent.click(screen.getByText("Edit Content"));

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
            .content.objects[0].object.__SkylarkSet__title as string,
        ),
      ).toBeInTheDocument();
    };

    test("reordering", async () => {
      await renderAndSwitchToEditView();

      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[2].object.__SkylarkSet__title as string,
      );

      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
      const input = screen.getByDisplayValue("1");
      input.focus();
      fireEvent.change(input, { target: { value: "3" } });
      fireEvent.blur(input);

      // Verify that the first object is now third
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[2].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
      );
    });

    test("when first item is made 0, it changes back to 1", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue("1")).toBeInTheDocument();

      const input = screen.getByDisplayValue("1");
      input.focus();
      fireEvent.change(input, { target: { value: "0" } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    });

    test("when last item is made 10000, it changes back to the length of the content array", async () => {
      await renderAndSwitchToEditView();
      const maxPosition =
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects.length;

      expect(maxPosition).toBeGreaterThan(0);

      expect(screen.getByDisplayValue(maxPosition)).toBeInTheDocument();
      expect(
        screen.getByTestId(`panel-object-content-item-${maxPosition}`),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[maxPosition - 1].object
          .__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(maxPosition);
      input.focus();
      fireEvent.change(input, { target: { value: "10000" } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue(maxPosition)).toBeInTheDocument();
      expect(
        screen.getByTestId(`panel-object-content-item-${maxPosition}`),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[maxPosition - 1].object
          .__SkylarkSet__title as string,
      );
    });

    test("doesn't change the value when the value is cleared", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(1);
      input.focus();
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);

      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        `${
          GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
            .content.objects[0].object.__SkylarkSet__title as string
        }1`,
      );
    });

    test("doesn't change the value when the value isn't a number", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(1);
      input.focus();
      fireEvent.change(input, { target: { value: "sdf" } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
    });

    test("removes an item from the content", async () => {
      await renderAndSwitchToEditView();

      const maxPosition =
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects.length;
      expect(maxPosition).toBeGreaterThan(0);

      expect(
        screen.queryByTestId(`panel-object-content-item-${maxPosition}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
      );

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      expect(
        screen.queryByTestId(`panel-object-content-item-${maxPosition}`),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
    });

    test("moves an item, removes an item and saves", async () => {
      await renderAndSwitchToEditView();

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      const input = screen.getByDisplayValue(2);
      input.focus();
      fireEvent.change(input, { target: { value: "3" } });
      fireEvent.blur(input);

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() =>
        expect(screen.queryByText("Editing")).not.toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getByText("Edit Content")).toBeInTheDocument(),
      );
    });

    test("moves an item, removes an item and saves but GraphQL returns an error", async () => {
      server.use(
        graphql.mutation("UPDATE_OBJECT_CONTENT_SkylarkSet", saveGraphQLError),
      );

      await renderAndSwitchToEditView();

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      const input = screen.getByDisplayValue(2);
      input.focus();
      fireEvent.change(input, { target: { value: "3" } });
      fireEvent.blur(input);

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await validateErrorToastShown();

      await waitFor(() =>
        expect(screen.queryByText("Editing")).toBeInTheDocument(),
      );
    });
  });
});

describe("availability view", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2023-03-10T00:00:00.000Z"));
  });

  test("render the panel", async () => {
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.Availability}
      />,
    );

    expect(
      screen.queryAllByText(
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title,
      ),
    ).toHaveLength(0);

    await waitFor(() =>
      expect(
        screen.getAllByText(
          GQLSkylarkGetObjectQueryFixture.data.getObject.title,
        ),
      ).toHaveLength(1),
    );

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );
    expect(screen.queryAllByText("Audience")).toHaveLength(
      numberOfAvailabilityInFixture,
    );
    expect(
      screen.getByText(
        GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
          .availability.objects[0].title,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
          .availability.objects[1].title,
      ),
    ).toBeInTheDocument();
  });

  test("shows no availability found when it is empty", async () => {
    server.use(
      graphql.query(
        createGetObjectAvailabilityQueryName("Movie"),
        (req, res, ctx) => {
          return res(
            ctx.data({
              getObjectAvailability: { availability: { objects: [] } },
            }),
          );
        },
      ),
    );

    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.Availability}
      />,
    );

    expect(
      screen.queryAllByText(
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title,
      ),
    ).toHaveLength(0);

    await waitFor(() => expect(screen.getByText("None")).toBeInTheDocument());
  });

  it("finds the status of each availability", async () => {
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.Availability}
      />,
    );

    expect(
      screen.queryAllByText(
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title,
      ),
    ).toHaveLength(0);

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );

    const withinAvailabilityTab = within(
      screen.getByTestId("panel-availability"),
    );
    expect(withinAvailabilityTab.queryAllByText("Expired")).toHaveLength(1);
    expect(withinAvailabilityTab.queryAllByText("Future")).toHaveLength(1);
    expect(withinAvailabilityTab.queryAllByText("Active")).toHaveLength(2);
  });

  it("converts start and end date to readable formats", async () => {
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.Availability}
      />,
    );

    expect(
      screen.queryAllByText(
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title,
      ),
    ).toHaveLength(0);

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );

    const { start, end } =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects[0];
    const startReadable = formatReadableDate(start);
    const endReadable = formatReadableDate(end);
    expect(screen.getByText(startReadable)).toBeInTheDocument();
    expect(screen.getByText(endReadable)).toBeInTheDocument();
    expect(screen.queryByText(start)).not.toBeInTheDocument();
    expect(screen.queryByText(end)).not.toBeInTheDocument();

    // Check readable status
    expect(
      screen.getByText(
        getRelativeTimeFromDate(AvailabilityStatus.Expired, start, end),
      ),
    ).toBeInTheDocument();
  });

  test("calls setPanelObject with the selected availability info when the OpenObjectButton is clicked", async () => {
    const setPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        setPanelObject={setPanelObject}
        tab={PanelTab.Availability}
      />,
    );

    expect(
      screen.queryAllByText(
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title,
      ),
    ).toHaveLength(0);

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType: "Availability",
      uid: GQLSkylarkGetObjectAvailabilityQueryFixture.data
        .getObjectAvailability.availability.objects[0].uid,
      language: "",
    });
  });

  describe("availability view - edit", () => {
    test("uses the object identifier card in edit mode", async () => {
      render(
        <Panel
          {...defaultProps}
          object={movieObject}
          tab={PanelTab.Availability}
        />,
      );

      expect(
        screen.queryAllByText(
          GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
            .title,
        ),
      ).toHaveLength(0);

      await waitFor(() =>
        expect(
          screen.getByText(
            GQLSkylarkGetObjectQueryFixture.data.getObject.availability
              .objects[0].title,
          ),
        ).toBeInTheDocument(),
      );

      expect(
        screen.queryAllByText("Time Window").length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.queryAllByText("Audience").length).toBeGreaterThanOrEqual(
        1,
      );

      fireEvent.click(screen.getByText("Edit Availability"));
      expect(screen.getByText("Editing")).toBeInTheDocument();

      expect(screen.queryAllByText("Time Window").length).toBe(0);
      expect(screen.queryAllByText("Audience").length).toBe(0);
    });

    test("removes an availability and cancels", async () => {
      const firstAvailabilityObjectTitle =
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title;
      render(
        <Panel
          {...defaultProps}
          object={movieObject}
          tab={PanelTab.Availability}
        />,
      );

      expect(
        screen.queryAllByText(
          GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
            .title,
        ),
      ).toHaveLength(0);

      await waitFor(() =>
        expect(
          screen.getByText(firstAvailabilityObjectTitle),
        ).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText("Edit Availability"));

      expect(screen.getByText("Editing")).toBeInTheDocument();

      fireEvent.click(screen.getAllByTestId("object-identifier-delete")[0]);

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );

      // Cancel
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        1,
      );
    });

    test("removes an availability and saves", async () => {
      const firstAvailabilityObjectTitle =
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title;
      render(
        <Panel
          {...defaultProps}
          object={movieObject}
          tab={PanelTab.Availability}
        />,
      );

      expect(
        screen.queryAllByText(
          GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
            .title,
        ),
      ).toHaveLength(0);

      await waitFor(() =>
        expect(
          screen.getByText(firstAvailabilityObjectTitle),
        ).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText("Edit Availability"));

      expect(screen.getByText("Editing")).toBeInTheDocument();

      fireEvent.click(screen.getAllByTestId("object-identifier-delete")[0]);

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );

      // Save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() =>
        expect(
          screen.getByText(firstAvailabilityObjectTitle),
        ).toBeInTheDocument(),
      );
    });

    test("removes an availability and saves, but GraphQL returns an error", async () => {
      server.use(
        graphql.mutation("UPDATE_OBJECT_AVAILABILITY_Movie", saveGraphQLError),
      );

      const firstAvailabilityObjectTitle =
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title;
      render(
        <Panel
          {...defaultProps}
          object={movieObject}
          tab={PanelTab.Availability}
        />,
      );

      expect(
        screen.queryAllByText(
          GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
            .title,
        ),
      ).toHaveLength(0);

      await waitFor(() =>
        expect(
          screen.getByText(firstAvailabilityObjectTitle),
        ).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText("Edit Availability"));

      expect(screen.getByText("Editing")).toBeInTheDocument();

      fireEvent.click(screen.getAllByTestId("object-identifier-delete")[0]);

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );

      // Save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await validateErrorToastShown();

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );
    });
  });
});

describe("availabity dimensions view", () => {
  test("render the panel and all dimensions", async () => {
    render(
      <Panel
        {...defaultProps}
        object={availabilityObject}
        tab={PanelTab.AvailabilityDimensions}
      />,
    );

    expect(screen.queryAllByText("Device type")).toHaveLength(0);

    await waitFor(() =>
      expect(screen.getByText("Dimensions")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Dimensions"));

    await waitFor(() =>
      expect(screen.getByText("Device type")).toBeInTheDocument(),
    );

    GQLSkylarkListAvailabilityDimensionsQueryFixture.data.listDimensions.objects.forEach(
      ({ title }) => {
        expect(screen.getByText(formatObjectField(title))).toBeInTheDocument();
      },
    );

    // Check availability pill in header
    expect(
      within(screen.getByTestId("panel-header")).getByText("Active"),
    ).toBeInTheDocument();
  });

  test("displays the current selected dimensions", async () => {
    render(
      <Panel
        {...defaultProps}
        object={availabilityObject}
        tab={PanelTab.AvailabilityDimensions}
      />,
    );

    expect(screen.queryAllByText("Device type")).toHaveLength(0);

    await waitFor(() =>
      expect(screen.getByText("Premium")).toBeInTheDocument(),
    );

    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.queryByText("Kids")).not.toBeInTheDocument();
  });

  describe("dimensions view - edit", () => {
    test("selects a new value", async () => {
      render(
        <Panel
          {...defaultProps}
          object={availabilityObject}
          tab={PanelTab.AvailabilityDimensions}
        />,
      );

      expect(screen.queryAllByText("Device type")).toHaveLength(0);

      await waitFor(() =>
        expect(screen.getByText("Dimensions")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByText("Dimensions"));

      await waitFor(() =>
        expect(screen.getByText("Premium")).toBeInTheDocument(),
      );

      const displayDiv = screen.getByText("Premium").parentElement
        ?.parentElement as HTMLDivElement;
      const wrapper = displayDiv?.parentElement as HTMLDivElement;
      fireEvent.click(wrapper);

      const combobox = within(wrapper).getByRole("combobox");
      fireEvent.click(combobox);

      expect(screen.queryAllByText("Standard")).toHaveLength(2);

      // Select new option
      expect(screen.queryByText("Kids")).toBeInTheDocument();
      expect(within(displayDiv).queryAllByText("Kids")).toHaveLength(0);
      fireEvent.click(screen.getByText("Kids"));

      // Check Pill is added
      expect(within(displayDiv).queryAllByText("Kids")).toHaveLength(1);
      expect(screen.getByText("Editing")).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(() =>
        expect(within(displayDiv).queryAllByText("Kids")).toHaveLength(0),
      );
    });

    test("removes a value", async () => {
      render(
        <Panel
          {...defaultProps}
          object={availabilityObject}
          tab={PanelTab.AvailabilityDimensions}
        />,
      );

      expect(screen.queryAllByText("Device type")).toHaveLength(0);

      await waitFor(() =>
        expect(screen.getByText("Dimensions")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByText("Dimensions"));

      await waitFor(() =>
        expect(screen.getByText("Premium")).toBeInTheDocument(),
      );

      const deselectButton = within(
        screen.getByText("Premium").parentElement as HTMLDivElement,
      ).getByRole("button");
      fireEvent.click(deselectButton);

      // Check Pill is added
      expect(screen.queryAllByText("Premium")).toHaveLength(0);
      expect(screen.getByText("Editing")).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryAllByText("Premium")).toHaveLength(1);
    });

    test("edits and saves", async () => {
      render(
        <Panel
          {...defaultProps}
          object={availabilityObject}
          tab={PanelTab.AvailabilityDimensions}
        />,
      );

      expect(screen.queryAllByText("Device type")).toHaveLength(0);

      await waitFor(() =>
        expect(screen.getByText("Dimensions")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByText("Dimensions"));

      await waitFor(() =>
        expect(screen.getByText("Premium")).toBeInTheDocument(),
      );

      const displayDiv = screen.getByText("Premium").parentElement
        ?.parentElement as HTMLDivElement;
      const wrapper = displayDiv?.parentElement as HTMLDivElement;
      fireEvent.click(wrapper);

      const combobox = within(wrapper).getByRole("combobox");
      fireEvent.click(combobox);

      expect(screen.queryAllByText("Standard")).toHaveLength(2);

      // Select new option
      expect(screen.queryByText("Kids")).toBeInTheDocument();
      expect(within(displayDiv).queryAllByText("Kids")).toHaveLength(0);
      fireEvent.click(screen.getByText("Kids"));

      // Check Pill is added
      expect(within(displayDiv).queryAllByText("Kids")).toHaveLength(1);
      expect(screen.getByText("Editing")).toBeInTheDocument();

      // Save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() =>
        expect(screen.queryByText("Editing")).not.toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getByText("Edit Dimensions")).toBeInTheDocument(),
      );
    });

    test("edits and saves, but GraphQL returns an error", async () => {
      server.use(
        graphql.mutation("UPDATE_AVAILABILITY_DIMENSIONS", saveGraphQLError),
      );

      render(
        <Panel
          {...defaultProps}
          object={availabilityObject}
          tab={PanelTab.AvailabilityDimensions}
        />,
      );

      expect(screen.queryAllByText("Device type")).toHaveLength(0);

      await waitFor(() =>
        expect(screen.getByText("Dimensions")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByText("Dimensions"));

      await waitFor(() =>
        expect(screen.getByText("Premium")).toBeInTheDocument(),
      );

      const displayDiv = screen.getByText("Premium").parentElement
        ?.parentElement as HTMLDivElement;
      const wrapper = displayDiv?.parentElement as HTMLDivElement;
      fireEvent.click(wrapper);

      const combobox = within(wrapper).getByRole("combobox");
      fireEvent.click(combobox);

      expect(screen.queryAllByText("Standard")).toHaveLength(2);

      // Select new option
      expect(screen.queryByText("Kids")).toBeInTheDocument();
      expect(within(displayDiv).queryAllByText("Kids")).toHaveLength(0);
      fireEvent.click(screen.getByText("Kids"));

      // Check Pill is added
      expect(within(displayDiv).queryAllByText("Kids")).toHaveLength(1);
      expect(screen.getByText("Editing")).toBeInTheDocument();

      // Save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await validateErrorToastShown();

      await waitFor(() =>
        expect(screen.queryByText("Editing")).toBeInTheDocument(),
      );
    });
  });
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

    expect(screen.getByText("Set")).toBeInTheDocument(),
      expect(screen.getByText(`Collection (1)`)).toBeInTheDocument(),
      await waitFor(() =>
        expect(screen.getByText(firstContentOfItem.title)).toBeInTheDocument(),
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
