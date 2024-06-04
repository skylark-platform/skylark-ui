import { graphql } from "msw";

import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json";
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
  saveGraphQLError,
  validateErrorToastShown,
} from "src/components/panel/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { PanelTab } from "src/hooks/state";
import { AvailabilityStatus } from "src/interfaces/skylark";
import {
  createGetObjectAvailabilityQueryName,
  wrapQueryName,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  formatReadableDateTime,
  getRelativeTimeFromDate,
} from "src/lib/skylark/availability";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
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
        wrapQueryName(createGetObjectAvailabilityQueryName("Movie")),
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

    await waitFor(() => expect(screen.getAllByText("None")).toHaveLength(2));
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
        .availability.objects[1];
    const startReadable = formatReadableDateTime(start);
    const endReadable = formatReadableDateTime(end);
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

  test("shows the inheritance summary when the availability is inherited", async () => {
    server.use(
      graphql.query(
        wrapQueryName(createGetObjectAvailabilityQueryName("Movie")),
        (req, res, ctx) => {
          return res(
            ctx.data({
              getObjectAvailability: {
                availability: {
                  objects: [
                    {
                      ...GQLSkylarkGetObjectAvailabilityQueryFixture.data
                        .getObjectAvailability.availability.objects[0],
                      active: true,
                      inherited: true,
                      inherited_source: false,
                    },
                  ],
                },
              },
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

    await waitFor(() =>
      expect(
        screen.getAllByText(
          GQLSkylarkGetObjectQueryFixture.data.getObject.title,
        ),
      ).toHaveLength(1),
    );

    const withinAvailabilityPanel = within(
      screen.getByTestId("panel-availability"),
    );

    // First Inherited is a header
    expect(
      withinAvailabilityPanel.getAllByText("Inherited").length,
    ).toBeGreaterThan(1);
    expect(withinAvailabilityPanel.queryByText("Enabled")).toBeInTheDocument();
    expect(
      withinAvailabilityPanel.queryByText("Disabled"),
    ).not.toBeInTheDocument();
  });

  test("shows the disabled in the inheritance summary when the availability is inherited but not active", async () => {
    server.use(
      graphql.query(
        wrapQueryName(createGetObjectAvailabilityQueryName("Movie")),
        (req, res, ctx) => {
          return res(
            ctx.data({
              getObjectAvailability: {
                availability: {
                  objects: [
                    {
                      ...GQLSkylarkGetObjectAvailabilityQueryFixture.data
                        .getObjectAvailability.availability.objects[0],
                      active: false,
                      inherited: true,
                      inherited_source: false,
                    },
                  ],
                },
              },
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

    await waitFor(() =>
      expect(
        screen.getAllByText(
          GQLSkylarkGetObjectQueryFixture.data.getObject.title,
        ),
      ).toHaveLength(1),
    );

    const withinAvailabilityPanel = within(
      screen.getByTestId("panel-availability"),
    );

    // First Inherited is a header
    expect(
      withinAvailabilityPanel.getAllByText("Inherited").length,
    ).toBeGreaterThan(1);
    expect(
      withinAvailabilityPanel.queryByText("Enabled"),
    ).not.toBeInTheDocument();
    expect(withinAvailabilityPanel.queryByText("Disabled")).toBeInTheDocument();
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
      name: "Open Object",
    })[0];
    await fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType: "Availability",
      uid: GQLSkylarkGetObjectAvailabilityQueryFixture.data
        .getObjectAvailability.availability.objects[0].uid,
      language: "",
    });
  });

  test("makes an availability active and then closes it", async () => {
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.Availability}
      />,
    );

    const title =
      GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
        .title;

    expect(screen.queryAllByText(title)).toHaveLength(0);

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );

    const expandButton = screen.getByLabelText(`expand availability: ${title}`);
    await fireEvent.click(expandButton);

    await waitFor(() =>
      expect(screen.getByText("Inherited by")).toBeInTheDocument(),
    );
    expect(screen.getByText("Inherited from")).toBeInTheDocument();

    const closeButton = screen.getByLabelText(`close availability: ${title}`);
    await fireEvent.click(closeButton);

    await waitFor(() =>
      expect(screen.queryByText("Inherited by")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Inherited from")).not.toBeInTheDocument();
  });

  test("makes an availability active and views its inherited by tab", async () => {
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.Availability}
      />,
    );

    const title =
      GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
        .title;

    expect(screen.queryAllByText(title)).toHaveLength(0);

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );

    const expandButton = screen.getByLabelText(`expand availability: ${title}`);
    await fireEvent.click(expandButton);

    await waitFor(() =>
      expect(screen.getByText("Inherited by")).toBeInTheDocument(),
    );

    // Check we're on the overview tab
    expect(screen.queryAllByText("Time Window").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.queryAllByText("Audience").length).toBeGreaterThanOrEqual(1);

    await fireEvent.click(screen.getByText("Inherited by"));

    // Check we've changed tab
    expect(screen.queryAllByText("Time Window").length).toBe(0);
    expect(screen.queryAllByText("Audience").length).toBe(0);

    // Check Inherited by object loads
    await waitFor(() => {
      expect(screen.getByText("Michael Madsen")).toBeInTheDocument();
    });
  });

  test("makes an availability active and views its inherited from tab", async () => {
    render(
      <Panel
        {...defaultProps}
        object={movieObject}
        tab={PanelTab.Availability}
      />,
    );

    const title =
      GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0]
        .title;

    expect(screen.queryAllByText(title)).toHaveLength(0);

    const numberOfAvailabilityInFixture =
      GQLSkylarkGetObjectAvailabilityQueryFixture.data.getObjectAvailability
        .availability.objects.length;
    await waitFor(() =>
      expect(screen.queryAllByText("Time Window")).toHaveLength(
        numberOfAvailabilityInFixture,
      ),
    );

    const expandButton = screen.getByLabelText(`expand availability: ${title}`);
    await fireEvent.click(expandButton);

    await waitFor(() =>
      expect(screen.getByText("Inherited from")).toBeInTheDocument(),
    );

    // Check we're on the overview tab
    expect(screen.queryAllByText("Time Window").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.queryAllByText("Audience").length).toBeGreaterThanOrEqual(1);

    await fireEvent.click(screen.getByText("Inherited from"));

    // Check we've changed tab
    expect(screen.queryAllByText("Time Window").length).toBe(0);
    expect(screen.queryAllByText("Audience").length).toBe(0);

    // Check Inherited from object loads
    await waitFor(() => {
      expect(screen.getByText("Kill Bill: Vol. 1")).toBeInTheDocument();
      expect(screen.getByText("Kill Bill: Vol. 2")).toBeInTheDocument();
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

      await fireEvent.click(screen.getByText("Edit Availability"));
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

      await fireEvent.click(screen.getByText("Edit Availability"));

      expect(screen.getByText("Editing")).toBeInTheDocument();

      await fireEvent.click(
        screen.getAllByTestId("object-identifier-delete")[0],
      );

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );

      // Cancel
      const cancelButton = screen.getByText("Cancel");
      await fireEvent.click(cancelButton);

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

      await fireEvent.click(screen.getByText("Edit Availability"));

      expect(screen.getByText("Editing")).toBeInTheDocument();

      await fireEvent.click(
        screen.getAllByTestId("object-identifier-delete")[0],
      );

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );

      // Save
      const saveButton = screen.getByText("Save");
      await fireEvent.click(saveButton);

      await waitFor(() =>
        expect(
          screen.getByText(firstAvailabilityObjectTitle),
        ).toBeInTheDocument(),
      );
    });

    test("removes an availability and saves, but GraphQL returns an error", async () => {
      server.use(
        graphql.mutation(
          wrapQueryName("UPDATE_OBJECT_AVAILABILITY_Movie"),
          saveGraphQLError,
        ),
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

      await fireEvent.click(screen.getByText("Edit Availability"));

      expect(screen.getByText("Editing")).toBeInTheDocument();

      await fireEvent.click(
        screen.getAllByTestId("object-identifier-delete")[0],
      );

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );

      // Save
      const saveButton = screen.getByText("Save");
      await fireEvent.click(saveButton);

      await validateErrorToastShown();

      expect(screen.queryAllByText(firstAvailabilityObjectTitle)).toHaveLength(
        0,
      );
    });

    test("toggles an inherited availabilities enabled state", async () => {
      const firstAvailabilityObject =
        GQLSkylarkGetObjectQueryFixture.data.getObject.availability.objects[0];

      server.use(
        graphql.query(
          wrapQueryName(createGetObjectAvailabilityQueryName("Movie")),
          (req, res, ctx) => {
            return res(
              ctx.data({
                getObjectAvailability: {
                  availability: {
                    objects: [
                      {
                        ...GQLSkylarkGetObjectAvailabilityQueryFixture.data
                          .getObjectAvailability.availability.objects[0],
                        active: false,
                        inherited: true,
                        inherited_source: false,
                      },
                    ],
                  },
                },
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

      await waitFor(() =>
        expect(
          screen.getByText(firstAvailabilityObject.title),
        ).toBeInTheDocument(),
      );

      await fireEvent.click(screen.getByText("Edit Availability"));

      expect(screen.getByText("Editing")).toBeInTheDocument();

      await fireEvent.click(screen.getAllByRole("switch")[0]);

      // Save
      const saveButton = screen.getByText("Save");
      await fireEvent.click(saveButton);

      await waitFor(() =>
        expect(
          screen.getByText(firstAvailabilityObject.title),
        ).toBeInTheDocument(),
      );
    });
  });
});
