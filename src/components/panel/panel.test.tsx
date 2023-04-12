import { graphql } from "msw";
import { useState } from "react";

import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01ptPT.json";
import GQLSkylarkGetSeasonWithRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetSetWithContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/setWithContent.json";
import GQLSkylarkGetObjectAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailability/allAvailTestMovieAvailability.json";
import GQLSkylarkGetSeasonRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/gots04relationships.json";
import { server } from "src/__tests__/mocks/server";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "src/__tests__/utils/test-utils";
import { QueryErrorMessages } from "src/enums/graphql";
import {
  AvailabilityStatus,
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
import { formatObjectField } from "src/lib/utils";

import { Panel } from "./panel.component";

const movieObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
  objectType: "Movie",
  language: "",
};

const imageObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid,
  objectType: "SkylarkImage",
  language: "",
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
  uid: GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid,
  objectType: "SkylarkSet",
  language: "",
};

const seasonWithRelationships: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.uid,
  objectType: "Season",
  language: "",
};

describe("metadata view", () => {
  test("renders the panel in the default view", async () => {
    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

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
      expect(screen.getByLabelText("Title long")).toHaveValue(
        "All Availabilities Test Movie (for dimension testing)",
      ),
    );
  });

  test("renders three sections system, translatable, global", async () => {
    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

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
    render(
      <Panel
        isPage
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

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

  test("hides the previous object and external open object buttons when isPage is true", async () => {
    render(
      <Panel
        isPage
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    expect(
      screen.queryAllByRole("button", {
        name: /Open Previous Object/i,
      }),
    ).toHaveLength(0);

    const panelHeader = within(screen.getByTestId("panel-header"));
    expect(panelHeader.queryAllByRole("link")).toHaveLength(0);
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
        object={{ ...movieObject, uid: "nonexistant" }}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    expect(
      screen.getByText('Movie "nonexistant" not found'),
    ).toBeInTheDocument();
  });

  test("renders object type not found when the object type isn't found in the schema", async () => {
    render(
      <Panel
        object={{ uid: "123", objectType: "nonexistant", language: "" }}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
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

    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("renders the objects primaryField and colour in the header when given", async () => {
    const withPrimaryFieldMock = {
      getObject: {
        ...GQLSkylarkGetObjectQueryFixture.data.getObject,
        uid: "withPrimaryField",
        _config: {
          ...GQLSkylarkGetObjectQueryFixture.data.getObject._config,
          primary_field: "release_date",
          colour: "rgb(123, 123, 123)",
        },
      },
    };

    server.use(
      graphql.query(createGetObjectQueryName("Movie"), (req, res, ctx) => {
        return res(ctx.data(withPrimaryFieldMock));
      }),
    );

    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());

    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText("Title long")).toHaveValue(
        "All Availabilities Test Movie (for dimension testing)",
      ),
    );
    const panelHeader = within(screen.getByTestId("panel-header"));
    expect(
      panelHeader.getByText(withPrimaryFieldMock.getObject.release_date),
    ).toBeInTheDocument();

    expect(
      panelHeader
        .getByText(withPrimaryFieldMock.getObject.__typename)
        .closest("div"),
    ).toHaveAttribute("style", "background-color: rgb(123, 123, 123);");
  });

  test("renders an image and the original image size when the object type is an Image", async () => {
    render(
      <Panel
        object={imageObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());

    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    expect(screen.getByText("Original size")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        GQLSkylarkGetObjectImageQueryFixture.data.getObject.title,
      ),
    ).toBeInTheDocument();
  });

  describe("multiple language versions", () => {
    test("renders the Portuguese GOT episode", async () => {
      render(
        <Panel
          object={episodeObjectPtPT}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
        />,
      );

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
          <Panel
            object={object}
            closePanel={jest.fn()}
            setPanelObject={setObject}
          />
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
      render(
        <Panel
          object={setObjectWithContent}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
        />,
      );

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
        <Panel
          object={setObjectWithContent}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
        />,
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
        <Panel
          object={setObjectWithContent}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
        />,
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toBeInTheDocument(),
      );

      const input = screen.getByLabelText("Title short");

      await waitFor(() => {
        expect(input).toHaveValue(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title_short,
        );
      });

      await user.clear(input);
      await user.type(input, "changed");

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      expect(input).toHaveValue("changed");

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(input).toHaveValue(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title_short,
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
                  ...GQLSkylarkGetSetWithContentQueryFixture.data.getObject,
                  title_short: changedValue,
                },
              }),
            );
          },
        ),
      );

      const { user } = render(
        <Panel
          object={setObjectWithContent}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
        />,
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toBeInTheDocument(),
      );

      const input = screen.getByLabelText("Title short");

      await waitFor(() => {
        expect(input).toHaveValue(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title_short,
        );
      });

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
        graphql.mutation(
          "UPDATE_OBJECT_METADATA_SkylarkSet",
          (req, res, ctx) => {
            return res(
              ctx.errors([{ errorType: "error", message: "invalid input" }]),
            );
          },
        ),
      );

      const { user } = render(
        <Panel
          object={setObjectWithContent}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
        />,
      );

      await waitFor(() =>
        expect(screen.getByLabelText("Title short")).toBeInTheDocument(),
      );

      const input = screen.getByLabelText("Title short");

      await waitFor(() => {
        expect(input).toHaveValue(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title_short,
        );
      });

      await user.clear(input);
      await user.type(input, "changed");

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

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
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("All Avail Test Movie")).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByText("Imagery")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Imagery"));

    expect(screen.getAllByText("All Avail Test Movie")).toHaveLength(1);
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
      GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].url,
    );
  });

  test("calls setPanelObject with the selected image info when the OpenObjectButton is clicked", async () => {
    const setPanelObject = jest.fn();
    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("All Avail Test Movie")).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByText("Imagery")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Imagery"));

    expect(screen.getAllByText("All Avail Test Movie")).toHaveLength(1);

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType: "SkylarkImage",
      uid: GQLSkylarkGetObjectQueryFixture.data.getObject.images.objects[0].uid,
      language: "",
    });
  });
});

describe("relationships view", () => {
  test("render the panel", async () => {
    render(
      <Panel
        object={seasonWithRelationships}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Relationships"));

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
        object={seasonWithRelationships}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Relationships"));

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
        object={seasonWithRelationships}
        closePanel={jest.fn()}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByText("Relationships")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Relationships"));

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(3));

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType: "Brand",
      uid: "01GWFN4R99SNF3QTAZ7JTZCTZ6",
      language: "",
    });
  });

  describe("relationships view - edit", () => {
    const renderAndSwitchToEditView = async () => {
      render(
        <Panel
          object={seasonWithRelationships}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
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

      fireEvent.click(screen.getByText("Relationships"));

      await waitFor(() =>
        expect(screen.getAllByText("Episode")).toHaveLength(3),
      );

      fireEvent.click(screen.getByText("Edit Relationships"));

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );
    };

    test("cancel/exit edit view", async () => {
      await renderAndSwitchToEditView();

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Editing")).not.toBeInTheDocument();
    });

    test("removes an item from the relationship list", async () => {
      await renderAndSwitchToEditView();

      expect(
        screen.getByTestId("panel-relationship-episodes-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSeasonRelationshipsQueryFixture.data.getObjectRelationships
          .episodes.objects[0].title as string,
      );

      const removeButton = screen.getByTestId(
        "panel-relationship-episodes-item-1-remove",
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

      const removeButton = screen.getByTestId(
        "panel-relationship-episodes-item-1-remove",
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
  });
});

describe("content view", () => {
  test("render the panel", async () => {
    render(
      <Panel
        object={setObjectWithContent}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Content"));

    expect(screen.getAllByText("Homepage")).toHaveLength(1);
    expect(
      screen.getByText(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object?.__SkylarkSet__title as string,
      ),
    ).toBeInTheDocument();
  });

  test("edit view", async () => {
    render(
      <Panel
        object={setObjectWithContent}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Content"));

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
        object={setObjectWithContent}
        closePanel={jest.fn()}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Content"));

    expect(screen.getAllByText("Homepage")).toHaveLength(1);

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType:
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object.__typename,
      uid: GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
        .objects[0].object.uid,
      language: "",
    });
  });

  describe("content view - edit", () => {
    const renderAndSwitchToEditView = async () => {
      render(
        <Panel
          object={setObjectWithContent}
          closePanel={jest.fn()}
          setPanelObject={jest.fn()}
        />,
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            GQLSkylarkGetSetWithContentQueryFixture.data.getObject.title,
          ),
        ).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByText("Content"));

      await waitFor(() =>
        expect(screen.getAllByText("Homepage")).toHaveLength(1),
      );

      fireEvent.click(screen.getByText("Edit Content"));

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      expect(
        screen.getByText(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
            .objects[0].object.__SkylarkSet__title as string,
        ),
      ).toBeInTheDocument();
    };

    test("cancel/exit edit view", async () => {
      await renderAndSwitchToEditView();

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Editing")).not.toBeInTheDocument();
    });

    test("reordering", async () => {
      await renderAndSwitchToEditView();

      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[1].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[2].object.__SkylarkSet__title as string,
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
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[1].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[2].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object.__SkylarkSet__title as string,
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
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content.objects
          .length;

      expect(maxPosition).toBeGreaterThan(0);

      expect(screen.getByDisplayValue(maxPosition)).toBeInTheDocument();
      expect(
        screen.getByTestId(`panel-object-content-item-${maxPosition}`),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content.objects[
          maxPosition - 1
        ].object.__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(maxPosition);
      input.focus();
      fireEvent.change(input, { target: { value: "10000" } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue(maxPosition)).toBeInTheDocument();
      expect(
        screen.getByTestId(`panel-object-content-item-${maxPosition}`),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content.objects[
          maxPosition - 1
        ].object.__SkylarkSet__title as string,
      );
    });

    test("doesn't change the value when the value is cleared", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object.__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(1);
      input.focus();
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);

      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        `${
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
            .objects[0].object.__SkylarkSet__title as string
        }1`,
      );
    });

    test("doesn't change the value when the value isn't a number", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[1].object.__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(1);
      input.focus();
      fireEvent.change(input, { target: { value: "sdf" } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[1].object.__SkylarkSet__title as string,
      );
    });

    test("removes an item from the content", async () => {
      await renderAndSwitchToEditView();

      const maxPosition =
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content.objects
          .length;
      expect(maxPosition).toBeGreaterThan(0);

      expect(
        screen.queryByTestId(`panel-object-content-item-${maxPosition}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object.__SkylarkSet__title as string,
      );

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "panel-object-content-item-remove",
      );
      fireEvent.click(removeButton);

      expect(
        screen.queryByTestId(`panel-object-content-item-${maxPosition}`),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[1].object.__SkylarkSet__title as string,
      );
    });

    test("moves an item, removes an item and saves", async () => {
      await renderAndSwitchToEditView();

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "panel-object-content-item-remove",
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
  });
});

describe("availability view", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2023-03-10T00:00:00.000Z"));
  });

  test("render the panel", async () => {
    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    expect(
      screen.queryAllByText(
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
          .title,
      ),
    ).toHaveLength(0);

    await waitFor(() =>
      expect(screen.getByText("Availability")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Availability"));

    expect(screen.getAllByText("All Avail Test Movie")).toHaveLength(1);

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
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Availability")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Availability"));

    await waitFor(() => expect(screen.getByText("None")).toBeInTheDocument());
  });

  it("finds sets the status of each availability", async () => {
    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Availability")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Availability"));

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );

    expect(screen.queryAllByText("Expired")).toHaveLength(1);
    expect(screen.queryAllByText("Future")).toHaveLength(1);
    expect(screen.queryAllByText("Active")).toHaveLength(2);
  });

  it("converts start and end date to readable formats", async () => {
    render(
      <Panel
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Availability")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Availability"));

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
        object={movieObject}
        closePanel={jest.fn()}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Availability")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Availability"));

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
});

test("closing the panel using close button", async () => {
  const closePanel = jest.fn();
  render(
    <Panel
      object={movieObject}
      closePanel={closePanel}
      setPanelObject={jest.fn()}
    />,
  );

  await waitFor(() => expect(screen.getByText("Close")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Close"));

  expect(closePanel).toHaveBeenCalled();
});
