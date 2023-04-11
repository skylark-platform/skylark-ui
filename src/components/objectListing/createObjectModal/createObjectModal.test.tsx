import { waitFor, screen } from "@testing-library/react";

import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import { render } from "src/__tests__/utils/test-utils";

import { CreateObjectModal } from "./createObjectModal.component";

test("renders the modal", async () => {
  render(
    <CreateObjectModal
      isOpen={true}
      setIsOpen={jest.fn()}
      onObjectCreated={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
  );
});

test("selects an Object Type and see's input fields appear", async () => {
  const { user } = render(
    <CreateObjectModal
      isOpen={true}
      setIsOpen={jest.fn()}
      onObjectCreated={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
  );

  expect(screen.queryAllByText("External id")).toHaveLength(0);
  expect(screen.queryAllByText("Create object")).toHaveLength(1);
  expect(screen.queryAllByText("Create Episode")).toHaveLength(0);

  user.click(screen.getByTestId("select"));

  await waitFor(() => expect(screen.queryAllByText("Episode")).toHaveLength(1));
  user.click(screen.getByText("Episode"));

  await waitFor(() =>
    expect(screen.queryAllByText("External id")).toHaveLength(1),
  );

  expect(screen.queryAllByText("Create Episode")).toHaveLength(2);
  expect(screen.queryAllByText("Create object")).toHaveLength(0);
});

test("cancels and closes the modal", async () => {
  const setIsOpen = jest.fn();

  const { user } = render(
    <CreateObjectModal
      isOpen={true}
      setIsOpen={setIsOpen}
      onObjectCreated={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
  );

  user.click(screen.getByTestId("select"));

  await waitFor(() => expect(screen.queryAllByText("Episode")).toHaveLength(1));
  user.click(screen.getByText("Episode"));

  await waitFor(() =>
    expect(screen.queryAllByText("External id")).toHaveLength(1),
  );

  const cancelButton = screen.getByText("Cancel");
  await user.click(cancelButton);

  expect(setIsOpen).toHaveBeenCalledWith(false);
});

test("adds a field value and saves", async () => {
  const setIsOpen = jest.fn();
  const onObjectCreated = jest.fn();

  const { user } = render(
    <CreateObjectModal
      isOpen={true}
      setIsOpen={setIsOpen}
      onObjectCreated={onObjectCreated}
    />,
  );

  await waitFor(() =>
    expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
  );

  expect(screen.queryAllByText("External id")).toHaveLength(0);

  user.click(screen.getByTestId("select"));

  await waitFor(() => expect(screen.queryAllByText("Episode")).toHaveLength(1));
  user.click(screen.getByText("Episode"));

  await waitFor(() =>
    expect(screen.queryAllByText("External id")).toHaveLength(1),
  );

  const createButton = screen.getByRole("button", { name: "Create Episode" });
  expect(createButton).toBeDisabled();

  await user.type(screen.getByLabelText("External id"), "my-external-id");

  await waitFor(() => expect(createButton).not.toBeDisabled());

  await user.click(createButton);

  expect(onObjectCreated).toHaveBeenCalledWith({
    language: undefined,
    objectType: "Episode",
    uid: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid,
  });
  expect(setIsOpen).toHaveBeenCalledWith(false);
});
