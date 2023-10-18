import { graphql } from "msw";
import { useState } from "react";

import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01ptPT.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import { server } from "src/__tests__/mocks/server";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "src/__tests__/utils/test-utils";
import {
  defaultProps,
  movieObject,
  imageObject,
  episodeObjectPtPT,
  episodeObjectEnGB,
  setObjectWithContent,
  saveGraphQLError,
  validateErrorToastShown,
} from "src/components/panel/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { QueryErrorMessages } from "src/enums/graphql";
import { createGetObjectQueryName } from "src/lib/graphql/skylark/dynamicQueries";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
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
