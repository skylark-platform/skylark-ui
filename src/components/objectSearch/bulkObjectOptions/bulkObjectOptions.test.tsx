import { ColumnDef } from "@tanstack/react-table";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";
import { CheckedObjectState } from "src/hooks/state";
import {
  AvailabilityStatus,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";

import { BulkObjectOptions } from "./bulkObjectOptions.component";

const genParsedObject = (uid: string): ParsedSkylarkObject =>
  ({
    uid,
    objectType: "Episode",
    meta: {
      availableLanguages: ["en-GB"],
      language: "en-GB",
      availabilityStatus: AvailabilityStatus.Active,
    },
    config: {},
    metadata: {},
  }) as ParsedSkylarkObject;

const defaultCheckedObjectState: CheckedObjectState[] = [
  { checkedState: true, object: genParsedObject("1") },
  { checkedState: true, object: genParsedObject("2") },
  { checkedState: true, object: genParsedObject("3") },
  { checkedState: false, object: genParsedObject("4") },
];

test("renders as disabled when checkedObjectState is empty", () => {
  render(<BulkObjectOptions checkedObjectsState={[]} />);

  expect(screen.getByText("Bulk Options")).toBeDisabled();
});

test("renders as disabled when checkedObjectState contains no checkedState true objects", () => {
  render(
    <BulkObjectOptions
      checkedObjectsState={[
        {
          checkedState: false,
          object: genParsedObject("1"),
        },
        {
          checkedState: "indeterminate",
          object: genParsedObject("2"),
        },
      ]}
    />,
  );

  expect(screen.getByText("Bulk Options")).toBeDisabled();
});

test("renders as enabled when checkedObjectState has more than one checked object", () => {
  render(
    <BulkObjectOptions
      checkedObjectsState={[
        { checkedState: true, object: genParsedObject("1") },
      ]}
    />,
  );

  expect(screen.getByText("Bulk Options")).toBeEnabled();
});

describe("delete objects", () => {
  const renderAndOpenBulkDeleteModal = async () => {
    const onObjectCheckedChanged = jest.fn();

    render(
      <BulkObjectOptions
        checkedObjectsState={defaultCheckedObjectState}
        onObjectCheckedChanged={onObjectCheckedChanged}
      />,
    );

    const bulkOptionsButton = screen.getByText("Bulk Options");
    expect(bulkOptionsButton).toBeEnabled();
    fireEvent.click(bulkOptionsButton);
    fireEvent.click(screen.getByText("Delete Selected Objects"));

    await waitFor(() => {
      expect(
        screen.getByText("The following objects will be permanently deleted:"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete objects"));

    return {
      onObjectCheckedChanged,
    };
  };

  const confirmDeletion = async (numObjects: number) => {
    const confirmationButton = screen.getByText(
      `Permanently delete ${numObjects} object(s)`,
    );

    expect(confirmationButton).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("permanently delete"), {
      target: { value: "permanently delete" },
    });

    expect(confirmationButton).toBeEnabled();
    fireEvent.click(confirmationButton);
  };

  test("opens bulk delete modal and deletes all selected objects", async () => {
    const { onObjectCheckedChanged } = await renderAndOpenBulkDeleteModal();

    await confirmDeletion(3);

    await waitFor(() => {
      expect(onObjectCheckedChanged).toHaveBeenCalled();
    });

    // Expect only the items with checkedState true to be deleted
    expect(onObjectCheckedChanged).toHaveBeenCalledWith(
      defaultCheckedObjectState.filter(
        ({ checkedState }) => checkedState !== true,
      ),
    );
  });

  test("opens bulk delete modal, removes an object from bulk delete and deletes the rest", async () => {
    const { onObjectCheckedChanged } = await renderAndOpenBulkDeleteModal();

    const removeObjectButton = screen.getAllByTestId(
      "object-identifier-delete",
    );
    fireEvent.click(removeObjectButton[0]);

    await confirmDeletion(2);

    await waitFor(() => {
      expect(onObjectCheckedChanged).toHaveBeenCalled();
    });

    // Expect only the items with checkedState true to be deleted
    expect(onObjectCheckedChanged).toHaveBeenCalledWith([
      defaultCheckedObjectState[0],
      defaultCheckedObjectState[3],
    ]);
  });
});
