import { graphql } from "msw";

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
import { GQLSkylarkGetAvailabilityAssignedResponse } from "src/interfaces/skylark";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

const generateAssignedToObjects = (
  numObjects: number,
  opts?: {
    inherited?: boolean;
    inheritanceSource?: boolean;
    active?: boolean;
  }[],
) =>
  Array.from({ length: numObjects }, (_, i) => ({
    inherited: opts?.[i].inherited ?? false,
    inheritance_source: opts?.[i].inheritanceSource ?? false,
    active: opts?.[i].active ?? true,
    object: {
      uid: `image_${i + 1}`,
      __typename: "SkylarkImage",
      external_id: null,
      __SkylarkImage__title: `Image ${i + 1}`,
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
  }));

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

    await fireEvent.change(objectTypeSelect, {
      target: { value: "Genr" },
    });

    const gotOptions = await screen.findAllByRole("option");
    expect(gotOptions).toHaveLength(1);

    await fireEvent.click(gotOptions[0]);

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

  describe("dimensions view - edit", () => {
    test("removes an object", async () => {
      server.use(
        graphql.query(
          wrapQueryName("GET_AVAILABILITY_ASSIGNED_TO"),
          (req, res, ctx) => {
            const data: GQLSkylarkGetAvailabilityAssignedResponse = {
              getAvailabilityAssignedTo: {
                assigned_to: {
                  objects: generateAssignedToObjects(5),
                },
              },
            };
            return res(ctx.data(data));
          },
        ),
        graphql.mutation(
          wrapQueryName("UPDATE_AVAILABILITY_ASSIGNED_TO"),
          (req, res, ctx) => {
            return res(ctx.data({}));
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

      await waitFor(() =>
        expect(screen.getByText("Image 2")).toBeInTheDocument(),
      );

      await fireEvent.click(screen.getByText("Edit Assigned To"));
      expect(screen.getByText("Editing")).toBeInTheDocument();

      const deleteButton = screen.getAllByTestId("object-identifier-delete")[1];
      await fireEvent.click(deleteButton);
      expect(screen.queryByText("Image 2")).not.toBeInTheDocument();

      await fireEvent.click(screen.getByText("Save"));
    });

    test("disables an object which is linked via inheritance", async () => {
      let afterSave = false;
      server.use(
        graphql.query(
          wrapQueryName("GET_AVAILABILITY_ASSIGNED_TO"),
          (req, res, ctx) => {
            const data: GQLSkylarkGetAvailabilityAssignedResponse = {
              getAvailabilityAssignedTo: {
                assigned_to: {
                  objects: generateAssignedToObjects(1, [
                    { inherited: true, active: afterSave ? false : true },
                  ]),
                },
              },
            };
            return res(ctx.data(data));
          },
        ),
        graphql.mutation(
          wrapQueryName("UPDATE_AVAILABILITY_ASSIGNED_TO"),
          (req, res, ctx) => {
            return res(ctx.data({}));
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

      await waitFor(() =>
        expect(screen.getByText("Image 1")).toBeInTheDocument(),
      );

      await fireEvent.click(screen.getByText("Edit Assigned To"));
      expect(screen.getByText("Editing")).toBeInTheDocument();

      let activeToggle = await screen.findByRole("switch");
      expect(activeToggle).toHaveAttribute("aria-checked", "true");

      await fireEvent.click(activeToggle);
      expect(activeToggle).toHaveAttribute("aria-checked", "false");

      await fireEvent.click(screen.getByText("Save"));
      afterSave = true;
      await waitFor(() =>
        expect(screen.queryByText("Editing")).not.toBeInTheDocument(),
      );
      expect(screen.getByText("Image 1")).toBeInTheDocument();

      await fireEvent.click(screen.getByText("Edit Assigned To"));
      expect(screen.getByText("Editing")).toBeInTheDocument();

      activeToggle = await screen.findByRole("switch");
      expect(activeToggle).toHaveAttribute("aria-checked", "false");
    });

    test("enables an object which is linked via inheritance", async () => {
      let calls = 0;
      server.use(
        graphql.query(
          wrapQueryName("GET_AVAILABILITY_ASSIGNED_TO"),
          (req, res, ctx) => {
            const data: GQLSkylarkGetAvailabilityAssignedResponse = {
              getAvailabilityAssignedTo: {
                assigned_to: {
                  objects: generateAssignedToObjects(1, [
                    { inherited: true, active: calls > 0 ? true : false },
                  ]),
                },
              },
            };
            calls += 1;
            return res(ctx.data(data));
          },
        ),
        graphql.mutation(
          wrapQueryName("UPDATE_AVAILABILITY_ASSIGNED_TO"),
          (req, res, ctx) => {
            return res(ctx.data({}));
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

      await waitFor(() =>
        expect(screen.getByText("Image 1")).toBeInTheDocument(),
      );

      await fireEvent.click(screen.getByText("Edit Assigned To"));
      expect(screen.getByText("Editing")).toBeInTheDocument();

      let activeToggle = await screen.findByRole("switch");
      expect(activeToggle).toHaveAttribute("aria-checked", "false");

      await fireEvent.click(activeToggle);
      expect(activeToggle).toHaveAttribute("aria-checked", "true");

      await fireEvent.click(screen.getByText("Save"));
      await waitFor(() =>
        expect(screen.queryByText("Editing")).not.toBeInTheDocument(),
      );

      await fireEvent.click(screen.getByText("Edit Assigned To"));
      expect(screen.getByText("Editing")).toBeInTheDocument();

      activeToggle = await screen.findByRole("switch");
      expect(activeToggle).toHaveAttribute("aria-checked", "true");
    });

    test("edits and saves, but GraphQL returns an error", async () => {
      server.use(
        graphql.query(
          wrapQueryName("GET_AVAILABILITY_ASSIGNED_TO"),
          (req, res, ctx) => {
            const data: GQLSkylarkGetAvailabilityAssignedResponse = {
              getAvailabilityAssignedTo: {
                assigned_to: {
                  objects: generateAssignedToObjects(5),
                },
              },
            };
            return res(ctx.data(data));
          },
        ),
        graphql.mutation(
          wrapQueryName("UPDATE_AVAILABILITY_ASSIGNED_TO"),
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

      await waitFor(() =>
        expect(screen.getByText("Image 1")).toBeInTheDocument(),
      );

      await fireEvent.click(screen.getByText("Edit Assigned To"));
      expect(screen.getByText("Editing")).toBeInTheDocument();

      const deleteButton = screen.getAllByTestId("object-identifier-delete")[0];
      await fireEvent.click(deleteButton);
      await fireEvent.click(screen.getByText("Save"));

      await validateErrorToastShown();

      await waitFor(() =>
        expect(screen.queryByText("Editing")).toBeInTheDocument(),
      );
    });
  });
});
