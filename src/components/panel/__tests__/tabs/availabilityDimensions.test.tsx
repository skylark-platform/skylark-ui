import { graphql } from "msw";

import GQLSkylarkListAvailabilityDimensionsQueryFixture from "src/__tests__/fixtures/skylark/queries/listDimensions.json";
import { server } from "src/__tests__/mocks/server";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "src/__tests__/utils/test-utils";
import {
  availabilityObject,
  defaultProps,
  saveGraphQLError,
  validateErrorToastShown,
} from "src/components/panel/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { PanelTab } from "src/hooks/state";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";
import { formatObjectField } from "src/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

describe("availabity dimensions view", () => {
  test("render the panel and all dimensions", async () => {
    render(
      <Panel
        {...defaultProps}
        object={availabilityObject}
        tab={PanelTab.AvailabilityAudience}
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
        tab={PanelTab.AvailabilityAudience}
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
          tab={PanelTab.AvailabilityAudience}
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
          tab={PanelTab.AvailabilityAudience}
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
          tab={PanelTab.AvailabilityAudience}
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
        expect(screen.getByText("Edit Audience")).toBeInTheDocument(),
      );
    });

    test("edits and saves, but GraphQL returns an error", async () => {
      server.use(
        graphql.mutation(
          wrapQueryName("UPDATE_AVAILABILITY_DIMENSIONS_AND_SEGMENTS"),
          saveGraphQLError,
        ),
      );

      render(
        <Panel
          {...defaultProps}
          object={availabilityObject}
          tab={PanelTab.AvailabilityAudience}
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
