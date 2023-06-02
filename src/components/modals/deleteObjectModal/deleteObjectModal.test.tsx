import { waitFor, screen } from "@testing-library/react";

import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import { render } from "src/__tests__/utils/test-utils";

import { DeleteObjectModal } from "./deleteObjectModal.component";

test("renders the modal", async () => {
  render(
    <DeleteObjectModal
      isOpen={true}
      setIsOpen={jest.fn()}
      onDeleteSuccess={jest.fn()}
      uid="123"
      objectType="Episode"
      language="en-GB"
      objectDisplayName="My Episode"
      objectTypeDisplayName="Episode"
      availableLanguages={[]}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("delete-object-modal")).toBeInTheDocument(),
  );
  expect(screen.getByText("Delete Episode")).toBeInTheDocument();
});

test("shows text saying it will delete a translation when more than one available language exists", async () => {
  render(
    <DeleteObjectModal
      isOpen={true}
      setIsOpen={jest.fn()}
      onDeleteSuccess={jest.fn()}
      uid="123"
      objectType="Episode"
      language="en-GB"
      objectDisplayName="My Episode"
      objectTypeDisplayName="Episode"
      availableLanguages={["en-GB", "pt-PT"]}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("delete-object-modal")).toBeInTheDocument(),
  );
  expect(screen.getByText('Delete "en-GB" translation')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Are you sure you want to delete the "en-GB" translation for the Episode "My Episode"?',
    ),
  ).toBeInTheDocument();
});

test("shows text saying it will delete the object when only one language exists", async () => {
  render(
    <DeleteObjectModal
      isOpen={true}
      setIsOpen={jest.fn()}
      onDeleteSuccess={jest.fn()}
      uid="123"
      objectType="Episode"
      language="en-GB"
      objectDisplayName="My Episode"
      objectTypeDisplayName="Episode"
      availableLanguages={["en-GB"]}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("delete-object-modal")).toBeInTheDocument(),
  );
  expect(screen.getByText("Delete Episode")).toBeInTheDocument();
  expect(
    screen.getByText(
      'Are you sure you want to delete the Episode "My Episode"?',
    ),
  ).toBeInTheDocument();
});

test("shows text saying it will delete the object when only no language is given", async () => {
  render(
    <DeleteObjectModal
      isOpen={true}
      setIsOpen={jest.fn()}
      onDeleteSuccess={jest.fn()}
      uid="123"
      objectType="Availability"
      language=""
      objectDisplayName="My Availability"
      objectTypeDisplayName="Availability Rule"
      availableLanguages={[]}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("delete-object-modal")).toBeInTheDocument(),
  );
  expect(screen.getByText("Delete Availability Rule")).toBeInTheDocument();
  expect(
    screen.getByText(
      'Are you sure you want to delete the Availability Rule "My Availability"?',
    ),
  ).toBeInTheDocument();
});

test("cancels and closes the modal", async () => {
  const setIsOpen = jest.fn();

  const { user } = render(
    <DeleteObjectModal
      isOpen={true}
      setIsOpen={setIsOpen}
      onDeleteSuccess={jest.fn()}
      uid="123"
      objectType="Episode"
      language="en-GB"
      objectDisplayName="My Episode"
      objectTypeDisplayName="Episode"
      availableLanguages={["en-GB", "pt-PT"]}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("delete-object-modal")).toBeInTheDocument(),
  );

  const cancelButton = screen.getByText("Cancel");
  await user.click(cancelButton);

  expect(setIsOpen).toHaveBeenCalledWith(false);
});

test("successfully deletes the translation and calls the onSuccess callback", async () => {
  const onDeleteSuccess = jest.fn();

  const { user } = render(
    <DeleteObjectModal
      isOpen={true}
      setIsOpen={jest.fn()}
      onDeleteSuccess={onDeleteSuccess}
      uid="123"
      objectType="Episode"
      language="en-GB"
      objectDisplayName="My Episode"
      objectTypeDisplayName="Episode"
      availableLanguages={["en-GB", "pt-PT"]}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("delete-object-modal")).toBeInTheDocument(),
  );

  const cancelButton = screen.getByText("Delete");
  await user.click(cancelButton);

  await waitFor(() => expect(onDeleteSuccess).toHaveBeenCalled());
});
