import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "src/__tests__/utils/test-utils";
import { Panel } from "src/components/panel/panel.component";
import { PanelTab } from "src/hooks/state";

import {
  defaultProps,
  movieObject,
  setObjectWithContent,
  skylarkAssetObject,
} from "./utils/test-utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: {} };
  useRouter.mockReturnValue(router);
});

describe("header (tab independent)", () => {
  test("closing the panel using close button", async () => {
    const closePanel = jest.fn();
    render(
      <Panel {...defaultProps} object={movieObject} closePanel={closePanel} />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Close Panel")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByLabelText("Close Panel"));

    expect(closePanel).toHaveBeenCalled();
  });

  test("switches to another tab", async () => {
    const setTab = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Metadata}
        setTab={setTab}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Content")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Content"));

    expect(setTab).toHaveBeenCalledWith("Content");
  });

  test("navigates to previous object using the arrows", () => {
    const navigateToPreviousPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Metadata}
        navigateToPreviousPanelObject={navigateToPreviousPanelObject}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Click to go back/i,
      }),
    );

    expect(navigateToPreviousPanelObject).toHaveBeenCalled();
  });

  test("navigates to next object using the arrows", () => {
    const navigateToForwardPanelObject = jest.fn();
    render(
      <Panel
        {...defaultProps}
        object={setObjectWithContent}
        tab={PanelTab.Metadata}
        navigateToForwardPanelObject={navigateToForwardPanelObject}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Click to go forward/i,
      }),
    );

    expect(navigateToForwardPanelObject).toHaveBeenCalled();
  });

  test("hides the previous object and external open object buttons when isPage is true", async () => {
    render(<Panel {...defaultProps} isPage object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    expect(
      screen.queryAllByRole("button", {
        name: /Click to go back/i,
      }),
    ).toHaveLength(0);

    const panelHeader = within(screen.getByTestId("panel-header"));
    expect(panelHeader.queryAllByRole("link")).toHaveLength(0);
  });

  test("cancel/exit edit view", async () => {
    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Edit Metadata"));

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByText("Editing")).not.toBeInTheDocument();
  });

  test("cancel/exit edit view using the escape key", async () => {
    render(<Panel {...defaultProps} object={movieObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Edit Metadata"));

    fireEvent.keyDown(screen.getByTestId("panel-header"), {
      key: "Escape",
      code: "Escape",
    });

    expect(screen.queryByText("Editing")).not.toBeInTheDocument();
  });

  test("save using the ctrl+s hotkey key", async () => {
    render(<Panel {...defaultProps} object={setObjectWithContent} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Edit Metadata"));

    await fireEvent.keyDown(screen.getByTestId("panel-header"), {
      key: "s",
      code: "s",
      ctrlKey: true,
    });

    await waitFor(() =>
      expect(screen.getByText("Edit Metadata")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Editing")).not.toBeInTheDocument();
  });

  test("shows lock icon when objectType is SkylarkAsset and it has a policy field of PRIVATE", async () => {
    render(<Panel {...defaultProps} object={skylarkAssetObject} />);

    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(
        screen.getByLabelText("Privacy policy: PRIVATE"),
      ).toBeInTheDocument(),
    );
  });
});
