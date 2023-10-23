import { graphql } from "msw";

import GQLSkylarkGetSeasonWithRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetSeasonRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/gots04relationships.json";
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
  seasonWithRelationships,
  saveGraphQLError,
  validateErrorToastShown,
} from "src/components/panel/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { PanelTab } from "src/hooks/state";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
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
