import { waitFor, screen, fireEvent } from "@testing-library/react";
import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import { render } from "src/__tests__/utils/test-utils";
import {
  AvailabilityStatus,
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";

import { BatchDeleteObjectsModal } from "./batchDeleteObjectsModal.component";

const object = convertParsedObjectToIdentifier({
  objectType: "Episode",
  uid: "123",
  meta: {
    language: "en-GB",
    availableLanguages: ["en-GB"],
    availabilityStatus: AvailabilityStatus.Unavailable,
    versions: {},
  },
  metadata: { uid: "123", external_id: "", type: null },
  config: { primaryField: "title" },
  availability: {
    objects: [],
    status: AvailabilityStatus.Unavailable,
  },
});

test("renders the modal", async () => {
  render(
    <BatchDeleteObjectsModal
      isOpen={true}
      objectsToBeDeleted={[]}
      closeModal={jest.fn()}
      onDeletionComplete={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(
      screen.getByTestId("batch-delete-objects-modal"),
    ).toBeInTheDocument(),
  );
  expect(screen.getByText("Bulk Delete")).toBeInTheDocument();
});

test("calls closeModal when cancel is clicked", async () => {
  const closeModal = jest.fn();

  render(
    <BatchDeleteObjectsModal
      isOpen={true}
      objectsToBeDeleted={[]}
      closeModal={closeModal}
      onDeletionComplete={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(
      screen.getByTestId("batch-delete-objects-modal"),
    ).toBeInTheDocument(),
  );

  fireEvent.click(screen.getByText("Cancel"));
  expect(closeModal).toHaveBeenCalled();
});

test("shows no objects to be deleted when objectsToBeDeleted is empty", async () => {
  render(
    <BatchDeleteObjectsModal
      isOpen={true}
      objectsToBeDeleted={[]}
      closeModal={jest.fn()}
      onDeletionComplete={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(
      screen.getByTestId("batch-delete-objects-modal"),
    ).toBeInTheDocument(),
  );
  expect(
    screen.getByText("No objects selected for deletion."),
  ).toBeInTheDocument();
});

test("shows this object will be deleted and the object when all available languages are selected", async () => {
  render(
    <BatchDeleteObjectsModal
      isOpen={true}
      objectsToBeDeleted={[object]}
      closeModal={jest.fn()}
      onDeletionComplete={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(
      screen.getByTestId("batch-delete-objects-modal"),
    ).toBeInTheDocument(),
  );
  expect(
    screen.getByText("The following object will be permanently deleted:"),
  ).toBeInTheDocument();
});

test("shows this translation will be deleted and the object when not all available languages are selected", async () => {
  render(
    <BatchDeleteObjectsModal
      isOpen={true}
      objectsToBeDeleted={[
        {
          ...object,
          availableLanguages: ["en-GB", "pt-PT"],
        },
      ]}
      closeModal={jest.fn()}
      onDeletionComplete={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(
      screen.getByTestId("batch-delete-objects-modal"),
    ).toBeInTheDocument(),
  );
  expect(
    screen.getByText("The following translation will be permanently deleted:"),
  ).toBeInTheDocument();
});

test("shows this translation will be deleted and the object when not all available languages are", async () => {
  render(
    <BatchDeleteObjectsModal
      isOpen={true}
      objectsToBeDeleted={[
        object,
        {
          ...object,
          uid: "245",
          objectType: "Movie",
          contextualFields: undefined,
        },
      ]}
      closeModal={jest.fn()}
      onDeletionComplete={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(
      screen.getByTestId("batch-delete-objects-modal"),
    ).toBeInTheDocument(),
  );
  expect(
    screen.getByText("The following objects will be permanently deleted:"),
  ).toBeInTheDocument();
  expect(screen.getByText(object.objectType)).toBeInTheDocument();
  expect(screen.getByText("123")).toBeInTheDocument();
  expect(screen.getByText("245")).toBeInTheDocument();
});

test("shows some objects will not be deleted when the number of objects exceeds the deletion limit", async () => {
  const objects: SkylarkObjectIdentifier[] = Array.from(
    { length: 150 },
    (_, i) => ({
      ...object,
      uid: `object-${i}`,
    }),
  );
  render(
    <BatchDeleteObjectsModal
      isOpen={true}
      objectsToBeDeleted={objects}
      closeModal={jest.fn()}
      onDeletionComplete={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(
      screen.getByTestId("batch-delete-objects-modal"),
    ).toBeInTheDocument(),
  );
  expect(
    screen.getByText("The following objects will be permanently deleted:"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("These objects will not be deleted:"),
  ).toBeInTheDocument();
});

describe("activated delete button", () => {
  const renderAndActivateDeleteButton = async () => {
    const closeModal = jest.fn();
    const onDeletionComplete = jest.fn();

    render(
      <BatchDeleteObjectsModal
        isOpen={true}
        objectsToBeDeleted={[
          object,
          {
            ...object,
            uid: "245",
            objectType: "Movie",
            contextualFields: undefined,
          },
        ]}
        closeModal={closeModal}
        onDeletionComplete={onDeletionComplete}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("batch-delete-objects-modal"),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Delete objects"));

    await screen.findByText(
      'To confirm deletion, enter "permanently delete" in the text input field.',
    );

    expect(screen.getByText("Permanently delete 2 object(s)")).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("permanently delete"), {
      target: { value: "permanently delete" },
    });

    expect(screen.getByText("Permanently delete 2 object(s)")).toBeEnabled();

    return {
      closeModal,
      onDeletionComplete,
    };
  };

  test("clicks Delete objects button, switches to confirmation screen, fills in the input, enables the delete button and cancels", async () => {
    await renderAndActivateDeleteButton();

    fireEvent.click(screen.getByText("Go back"));

    expect(
      screen.queryByText("Permanently delete 2 object(s)"),
    ).not.toBeInTheDocument();
  });

  test("deletes objects and finds a success toast", async () => {
    await renderAndActivateDeleteButton();

    fireEvent.click(screen.getByText("Permanently delete 2 object(s)"));

    await waitFor(() =>
      expect(screen.getByText("Batch deletion triggered")).toBeInTheDocument(),
    );
  });

  test("errors while deleting objects and finds an error toast", async () => {
    server.use(
      graphql.mutation(wrapQueryName("BATCH_DELETE"), (req, res, ctx) => {
        return res(
          ctx.errors([
            {
              message: "Not authorized",
            },
          ]),
        );
      }),
    );

    await renderAndActivateDeleteButton();

    fireEvent.click(screen.getByText("Permanently delete 2 object(s)"));

    await waitFor(() =>
      expect(
        screen.getByText("Batch deletion failed to trigger"),
      ).toBeInTheDocument(),
    );
  });
});
