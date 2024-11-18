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
import {
  createGetObjectRelationshipsQueryName,
  wrapQueryName,
} from "src/lib/graphql/skylark/dynamicQueries";

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

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));

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

  test("displays the relationship sort field", async () => {
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));

    const withinEpisodesRelationship = within(screen.getByTestId("episodes"));
    const select = withinEpisodesRelationship.getByTestId("select");

    expect(select).toHaveTextContent('"episode_number"');
  });

  test("displays the value of the relationship sort field", async () => {
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));

    const withinFirstEpisodeCard = within(
      screen.getByTestId("panel-relationship-episodes-item-1"),
    );

    await waitFor(() => {
      expect(
        withinFirstEpisodeCard.getByTestId("object-sort-field"),
      ).toHaveTextContent("1");
    });
  });

  test("edit view", async () => {
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));

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

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: "Open Object",
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectType: "Brand",
        uid: "01H4MMDGADSP73B3MBM89VZTQC",
        language: "en-GB",
      }),
    );
  });

  test("makes a relationship active and then closes it", async () => {
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));
    await waitFor(() =>
      expect(screen.queryByText("Brands")).toBeInTheDocument(),
    );

    const withinEpisodesRelationship = within(screen.getByTestId("episodes"));

    const expandButton = withinEpisodesRelationship.getByLabelText(
      "expand episodes relationship",
    );
    fireEvent.click(expandButton);

    await waitFor(() =>
      expect(screen.getAllByText("Episode")).toHaveLength(10),
    );

    await waitFor(() =>
      expect(screen.queryByText("Brands")).not.toBeInTheDocument(),
    );

    const closeButton = withinEpisodesRelationship.getByLabelText(
      "close episodes relationship",
    );
    fireEvent.click(closeButton);

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));
    await waitFor(() =>
      expect(screen.queryByText("Brands")).toBeInTheDocument(),
    );
  });

  test("makes a relationship active using the side navigation when in page mode", async () => {
    render(
      <Panel
        {...defaultProps}
        isPage
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    const withinSideNavigation = within(
      screen.getByTestId("panel-page-side-navigation"),
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));
    await waitFor(() =>
      expect(screen.queryByTestId("brands")).toBeInTheDocument(),
    );

    const navigationButton = withinSideNavigation.getByText("Episodes");
    fireEvent.click(navigationButton);

    await waitFor(() =>
      expect(screen.getAllByText("Episode")).toHaveLength(10),
    );

    await waitFor(() =>
      expect(screen.queryByTestId("brands")).not.toBeInTheDocument(),
    );
  });

  test("calls updateActivePanelTabState with the selected relationship info when it is made active", async () => {
    const updateActivePanelTabState = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
        updateActivePanelTabState={updateActivePanelTabState}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));

    const withinEpisodesRelationship = within(screen.getByTestId("episodes"));

    const showMoreButton = withinEpisodesRelationship.getByText("Show more");
    fireEvent.click(showMoreButton);

    await waitFor(() =>
      expect(screen.getAllByText("Episode")).toHaveLength(10),
    );

    expect(updateActivePanelTabState).toHaveBeenCalledWith({
      Relationships: {
        active: "episodes",
      },
    });
  });

  test("paginates when a next_token is returned", async () => {
    server.use(
      graphql.query(
        wrapQueryName(createGetObjectRelationshipsQueryName("Season")),
        (req, res, ctx) => {
          if (req.variables.episodesNextToken) {
            // When episode next_token is found, return a slightly altered second list of 10 episodes
            return res(
              ctx.data({
                getObjectRelationships: {
                  episodes: {
                    ...GQLSkylarkGetSeasonRelationshipsQueryFixture.data
                      .getObjectRelationships.episodes,
                    objects:
                      GQLSkylarkGetSeasonRelationshipsQueryFixture.data.getObjectRelationships.episodes.objects.map(
                        (episode, i) => {
                          const newEpisodeNumber =
                            episode.episode_number + i + 1;

                          return {
                            ...episode,
                            uid: episode.uid + newEpisodeNumber,
                            episode_number: newEpisodeNumber,
                          };
                        },
                      ),
                  },
                },
              }),
            );
          }

          // Add a next token to initial response
          return res(
            ctx.data({
              getObjectRelationships: {
                ...GQLSkylarkGetSeasonRelationshipsQueryFixture.data
                  .getObjectRelationships,
                episodes: {
                  ...GQLSkylarkGetSeasonRelationshipsQueryFixture.data
                    .getObjectRelationships.episodes,
                  next_token: "next-page",
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
        object={seasonWithRelationships}
        tab={PanelTab.Relationships}
      />,
    );

    await waitFor(() => expect(screen.getAllByText("Episode")).toHaveLength(5));

    const withinEpisodesRelationship = within(screen.getByTestId("episodes"));

    const showMoreButton = withinEpisodesRelationship.getByText("Show more");
    fireEvent.click(showMoreButton);

    await waitFor(() =>
      expect(screen.getByText("Episodes")).toBeInTheDocument(),
    );
    expect(screen.getByText("Episodes").parentNode?.textContent).toBe(
      "Episodes (10+)",
    );

    const loadMoreButton = withinEpisodesRelationship.getByText("Load more");
    fireEvent.click(loadMoreButton);

    await waitFor(() => expect(screen.getByText("(20)")).toBeInTheDocument());
    expect(screen.getByText("Episodes").parentNode?.textContent).toBe(
      "Episodes (20)",
    );

    expect(screen.getAllByText("Episode")).toHaveLength(20);
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
        expect(screen.getAllByText("Episode")).toHaveLength(5),
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
          wrapQueryName("UPDATE_OBJECT_RELATIONSHIPS_Season"),
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
