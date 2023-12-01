import { graphql } from "msw";

import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import GQLSkylarkGetHomepageSetContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectContent/homepage.json";
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
  saveGraphQLError,
  setObjectWithContent,
  validateErrorToastShown,
} from "src/components/panel/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { PanelTab } from "src/hooks/state";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

describe("content view", () => {
  test("render the panel", async () => {
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Content}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getAllByText("Homepage")).toHaveLength(1);

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
            .content.objects[0].object?.__SkylarkSet__title as string,
        ),
      ).toBeInTheDocument(),
    );
  });

  test("edit view", async () => {
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Content}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

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
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Content}
        setPanelObject={setPanelObject}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getAllByText("Homepage")).toHaveLength(1);

    const firstContentItemTitle = GQLSkylarkGetHomepageSetContentQueryFixture
      .data.getObjectContent.content.objects[0].object
      .__SkylarkSet__title as string;
    await waitFor(() =>
      expect(screen.getByText(firstContentItemTitle)).toBeInTheDocument(),
    );

    const firstOpenObjectButton = screen.getAllByRole("button", {
      name: /Open Object/i,
    })[0];
    fireEvent.click(firstOpenObjectButton);

    expect(setPanelObject).toHaveBeenCalledWith({
      objectType:
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__typename,
      uid: GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
        .content.objects[0].object.uid,
      language: "en-GB",
    });
  });

  describe("content view - edit", () => {
    const renderAndSwitchToEditView = async () => {
      render(
        <Panel
          {...defaultProps}
          object={setObjectWithContent}
          tab={PanelTab.Content}
        />,
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            GQLSkylarkGetHomepageSetQueryFixture.data.getObject.title,
          ),
        ).toBeInTheDocument(),
      );

      await waitFor(() =>
        expect(screen.getAllByText("Homepage")).toHaveLength(1),
      );

      fireEvent.click(screen.getByText("Edit Content"));

      await waitFor(() =>
        expect(screen.getByText("Editing")).toBeInTheDocument(),
      );

      expect(
        screen.getByText(
          GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
            .content.objects[0].object.__SkylarkSet__title as string,
        ),
      ).toBeInTheDocument();
    };

    test("reordering", async () => {
      await renderAndSwitchToEditView();

      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[2].object.__SkylarkSet__title as string,
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
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[2].object.__SkylarkSet__title as string,
      );
      expect(
        screen.getByTestId("panel-object-content-item-3"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
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
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects.length;

      expect(maxPosition).toBeGreaterThan(0);

      expect(screen.getByDisplayValue(maxPosition)).toBeInTheDocument();
      expect(
        screen.getByTestId(`panel-object-content-item-${maxPosition}`),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[maxPosition - 1].object
          .__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(maxPosition);
      input.focus();
      fireEvent.change(input, { target: { value: "10000" } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue(maxPosition)).toBeInTheDocument();
      expect(
        screen.getByTestId(`panel-object-content-item-${maxPosition}`),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[maxPosition - 1].object
          .__SkylarkSet__title as string,
      );
    });

    test("doesn't change the value when the value is cleared", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(1);
      input.focus();
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);

      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        `${
          GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
            .content.objects[0].object.__SkylarkSet__title as string
        }1`,
      );
    });

    test("doesn't change the value when the value isn't a number", async () => {
      await renderAndSwitchToEditView();

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );

      const input = screen.getByDisplayValue(1);
      input.focus();
      fireEvent.change(input, { target: { value: "sdf" } });
      fireEvent.blur(input);

      expect(screen.getByDisplayValue(1)).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-2"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
    });

    test("removes an item from the content", async () => {
      await renderAndSwitchToEditView();

      const maxPosition =
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects.length;
      expect(maxPosition).toBeGreaterThan(0);

      expect(
        screen.queryByTestId(`panel-object-content-item-${maxPosition}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[0].object.__SkylarkSet__title as string,
      );

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      expect(
        screen.queryByTestId(`panel-object-content-item-${maxPosition}`),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("panel-object-content-item-1"),
      ).toHaveTextContent(
        GQLSkylarkGetHomepageSetContentQueryFixture.data.getObjectContent
          .content.objects[1].object.__SkylarkSet__title as string,
      );
    });

    test("moves an item, removes an item and saves", async () => {
      await renderAndSwitchToEditView();

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "object-identifier-delete",
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

    test("moves an item, removes an item and saves but GraphQL returns an error", async () => {
      server.use(
        graphql.mutation(
          wrapQueryName("UPDATE_OBJECT_CONTENT_SkylarkSet"),
          saveGraphQLError,
        ),
      );

      await renderAndSwitchToEditView();

      const withinPanelObjectContentItem1 = within(
        screen.getByTestId("panel-object-content-item-1"),
      );
      const removeButton = withinPanelObjectContentItem1.getByTestId(
        "object-identifier-delete",
      );
      fireEvent.click(removeButton);

      const input = screen.getByDisplayValue(2);
      input.focus();
      fireEvent.change(input, { target: { value: "3" } });
      fireEvent.blur(input);

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await validateErrorToastShown();

      await waitFor(() =>
        expect(screen.queryByText("Editing")).toBeInTheDocument(),
      );
    });
  });
});
