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

const findFilters = async () => {
  const objectTypeSelect = await screen.findByPlaceholderText(
    "Filter for Object Type",
  );

  const hideInheritCheckbox = await screen.findByLabelText(
    "Hide objects linked via Inheritance",
  );

  const withinAssignedToTab = within(
    screen.getByTestId("panel-availability-assigned-to"),
  );

  return {
    objectTypeSelect,
    hideInheritCheckbox,
    withinAssignedToTab,
  };
};

describe("availabity assigned to view", () => {
  test("render the panel and all assigned_to objects", async () => {
    render(
      <Panel
        {...defaultProps}
        object={availabilityObject}
        tab={PanelTab.AvailabilityAssignedTo}
      />,
    );

    const { objectTypeSelect, hideInheritCheckbox } = await findFilters();

    expect(objectTypeSelect).toBeInTheDocument();
    expect(hideInheritCheckbox).toBeInTheDocument();

    expect(await screen.findByText("sound of metal.jpeg")).toBeInTheDocument();
  });

  test("filters to the Genre object type", async () => {
    render(
      <Panel
        {...defaultProps}
        object={availabilityObject}
        tab={PanelTab.AvailabilityAssignedTo}
      />,
    );

    const { objectTypeSelect } = await findFilters();

    await fireEvent.change(objectTypeSelect, { target: { value: "Genre" } });

    await waitFor(() => {
      expect(objectTypeSelect).not.toBeDisabled();
    });

    fireEvent.change(objectTypeSelect, {
      target: { value: "Genr" },
    });

    const gotOptions = await screen.findAllByRole("option");
    expect(gotOptions).toHaveLength(1);

    await fireEvent.click(screen.getByText("Genre"));

    expect(await screen.findByText("Science fiction")).toBeInTheDocument();
    expect(screen.queryByText("sound of metal.jpeg")).not.toBeInTheDocument();
  });

  test("hides objects that have inherited the availability", async () => {
    server.use(
      graphql.query(
        wrapQueryName("GET_AVAILABILITY_ASSIGNED_TO"),
        (_, res, ctx) => {
          return res(
            ctx.data({
              getAvailabilityAssignedTo: {
                __typename: "Availability",
                assigned_to: {
                  next_token: "",
                  objects: [
                    {
                      inherited: true,
                      inheritance_source: false,
                      active: true,
                      object: {
                        uid: "01HMY55HJM3VS29FTG2VJ8TDVW",
                        __typename: "SkylarkImage",
                        external_id: "recjW0KgxIa9IUE96",
                        __SkylarkImage__title: "inherited object",
                        _meta: {
                          available_languages: ["en-GB"],
                          language_data: {
                            language: "en-GB",
                            version: 1,
                          },
                          global_data: {
                            version: 1,
                          },
                          modified: {
                            date: "2024-01-24T16:34:33.821467+00:00",
                          },
                          created: {
                            date: "2024-01-24T16:34:33.821467+00:00",
                          },
                          published: true,
                        },
                      },
                    },
                    {
                      inherited: false,
                      inheritance_source: false,
                      active: true,
                      object: {
                        uid: "01HMY553YK945GC0MECBHP25CZ",
                        __typename: "SkylarkImage",
                        external_id: "recE0IWPOEd4HZQIK",
                        __SkylarkImage__title: "assigned object",
                        _meta: {
                          available_languages: ["en-GB"],
                          language_data: {
                            language: "en-GB",
                            version: 1,
                          },
                          global_data: {
                            version: 1,
                          },
                          modified: {
                            date: "2024-01-24T16:34:33.821467+00:00",
                          },
                          created: {
                            date: "2024-01-24T16:34:33.821467+00:00",
                          },
                          published: true,
                        },
                      },
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
        object={availabilityObject}
        tab={PanelTab.AvailabilityAssignedTo}
      />,
    );

    const { hideInheritCheckbox, withinAssignedToTab } = await findFilters();

    expect(
      await withinAssignedToTab.findByText("inherited object"),
    ).toBeInTheDocument();
    expect(
      withinAssignedToTab.queryByText("assigned object"),
    ).toBeInTheDocument();

    expect(hideInheritCheckbox).not.toBeChecked();
    fireEvent.click(hideInheritCheckbox);
    expect(hideInheritCheckbox).toBeChecked();

    expect(
      withinAssignedToTab.queryByText("inherited object"),
    ).not.toBeInTheDocument();
    expect(
      withinAssignedToTab.queryByText("assigned object"),
    ).toBeInTheDocument();
  });

  describe.skip("dimensions view - edit", () => {
    test("selects a new value", async () => {
      render(
        <Panel
          {...defaultProps}
          object={availabilityObject}
          tab={PanelTab.AvailabilityAssignedTo}
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
          tab={PanelTab.AvailabilityAssignedTo}
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
          tab={PanelTab.AvailabilityAssignedTo}
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
        graphql.mutation(
          wrapQueryName("UPDATE_AVAILABILITY_DIMENSIONS"),
          saveGraphQLError,
        ),
      );

      render(
        <Panel
          {...defaultProps}
          object={availabilityObject}
          tab={PanelTab.AvailabilityAssignedTo}
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
