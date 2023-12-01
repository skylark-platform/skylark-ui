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
