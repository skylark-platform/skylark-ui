import { graphql } from "msw";

import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetSetWithContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/setWithContent.json";
import GQLSkylarkGetObjectAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailability/allAvailTestMovieAvailability.json";
import { server } from "src/__tests__/mocks/server";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "src/__tests__/utils/test-utils";
import { QueryErrorMessages } from "src/enums/graphql";
import { AvailabilityStatus } from "src/interfaces/skylark";
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

test("renders the panel in the default view", async () => {
  render(
    <Panel
      uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
      objectType={"Movie"}
      closePanel={jest.fn()}
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
  expect(
    screen.getByText("All Availabilities Test Movie (for dimension testing)"),
  ).toBeInTheDocument();
  expect(screen.getAllByText("All Avail Test Movie")).toHaveLength(2);
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
    <Panel uid="nonexistant" objectType={"Movie"} closePanel={jest.fn()} />,
  );

  await waitFor(() =>
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
  );

  expect(screen.getByText("Movie nonexistant not found")).toBeInTheDocument();
});

test("renders an error message when an unknown error occurs", async () => {
  server.use(
    graphql.query(createGetObjectQueryName("Movie"), (req, res, ctx) => {
      return res(ctx.errors([{ message: "Something went wrong" }]));
    }),
  );

  render(
    <Panel
      uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
      objectType={"Movie"}
      closePanel={jest.fn()}
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
      uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
      objectType={"Movie"}
      closePanel={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
  );
  await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());

  expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  expect(
    screen.getByText("All Availabilities Test Movie (for dimension testing)"),
  ).toBeInTheDocument();
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
      uid={GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid}
      objectType={"Image"}
      closePanel={jest.fn()}
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

describe("imagery view", () => {
  test("renders the panel", async () => {
    render(
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
      />,
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
});

describe("content view", () => {
  test("render the panel", async () => {
    render(
      <Panel
        uid={GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid}
        objectType={"Set"}
        closePanel={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Content")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Content"));

    expect(screen.getAllByText("Homepage")).toHaveLength(1);
    expect(
      screen.getByText(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object?.__Season__title as string,
      ),
    ).toBeInTheDocument();
  });

  test("edit view", async () => {
    render(
      <Panel
        uid={GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid}
        objectType={"Set"}
        closePanel={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Content")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Content"));

    expect(screen.getAllByText("Homepage")).toHaveLength(1);

    fireEvent.click(screen.getByText("Edit Content"));

    await waitFor(() =>
      expect(screen.getByText("Editing")).toBeInTheDocument(),
    );
  });

  describe("content view - edit view", () => {
    const renderAndSwitchToEditView = async () => {
      render(
        <Panel
          uid={GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid}
          objectType={"Set"}
          closePanel={jest.fn()}
        />,
      );

      await waitFor(() =>
        expect(screen.getByText("Content")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByText("Content"));

      expect(screen.getAllByText("Homepage")).toHaveLength(1);

      fireEvent.click(screen.getByText("Edit Content"));

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      expect(
        screen.getByText(
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
            .objects[0].object.__Season__title as string,
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
          .objects[0].object.__Season__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[1].object.__Season__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[2].object.__Season__title as string,
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
          .objects[1].object.__Season__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[2].object.__Season__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object.__Season__title as string,
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
        ].object.__Set__title as string,
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
        ].object.__Set__title as string,
      );
    });

    test("doesn't change the value when the value is cleared", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[0].object.__Season__title as string,
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
            .objects[0].object.__Season__title as string
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
          .objects[1].object.__Season__title as string,
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
          .objects[1].object.__Season__title as string,
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
          .objects[0].object.__Season__title as string,
      );

      const removeButton = screen.getByTestId(
        "panel-object-content-item-1-remove",
      );
      fireEvent.click(removeButton);

      expect(
        screen.queryByTestId(`panel-object-content-item-${maxPosition}`),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetSetWithContentQueryFixture.data.getObject.content
          .objects[1].object.__Season__title as string,
      );
    });

    test("moves an item, removes an item and saves", async () => {
      await renderAndSwitchToEditView();

      const removeButton = screen.getByTestId(
        "panel-object-content-item-1-remove",
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
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
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
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Availability")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Availability"));

    await waitFor(() =>
      expect(
        screen.getByText("No availability assigned to this object."),
      ).toBeInTheDocument(),
    );
  });

  it("finds sets the status of each availability", async () => {
    render(
      <Panel
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
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
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        objectType={"Movie"}
        closePanel={jest.fn()}
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
});

test("closing the panel using close button", async () => {
  const closePanel = jest.fn();
  render(
    <Panel
      uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
      objectType={"Movie"}
      closePanel={closePanel}
    />,
  );

  await waitFor(() => expect(screen.getByText("Close")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Close"));

  expect(closePanel).toHaveBeenCalled();
});
