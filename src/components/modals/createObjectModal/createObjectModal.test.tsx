import { waitFor, screen, fireEvent } from "@testing-library/react";

import GQLSkylarkAccountFixture from "src/__tests__/fixtures/skylark/queries/getAccount.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import { render } from "src/__tests__/utils/test-utils";

import { CreateObjectModal } from "./createObjectModal.component";

describe("Create Object (new object)", () => {
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
    expect(screen.queryAllByText("Create Object")).toHaveLength(1);
    expect(screen.queryAllByText("Create Episode")).toHaveLength(0);

    user.click(screen.getByTestId("select"));

    await waitFor(() =>
      expect(screen.queryAllByText("Episode")).toHaveLength(1),
    );
    user.click(screen.getByText("Episode"));

    await waitFor(() =>
      expect(screen.queryAllByText("External id")).toHaveLength(1),
    );

    expect(screen.queryAllByText("Create Episode")).toHaveLength(2);
    expect(screen.queryAllByText("Create Object")).toHaveLength(0);
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

    await waitFor(() =>
      expect(screen.queryAllByText("Episode")).toHaveLength(1),
    );
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

    await waitFor(() =>
      expect(screen.queryAllByText("Episode")).toHaveLength(1),
    );
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
      language:
        GQLSkylarkAccountFixture.data.getAccount.config.default_language,
      objectType: "Episode",
      uid: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid,
    });
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });
});

describe("Create Translation (existing object)", () => {
  test("when createTranslation object is passed it displays only translation data", async () => {
    render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={jest.fn()}
        onObjectCreated={jest.fn()}
        createTranslation={{
          objectType: "Episode",
          objectTypeDisplayName: "Episode",
          objectDisplayName: "GOT S01E01",
          uid: "123",
          language: "en-GB",
          existingLanguages: [],
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
    );

    expect(screen.getByText("Create Episode Translation")).toBeInTheDocument();
    expect(
      screen.getByText("Select language and add translatable data."),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Language")).toBeInTheDocument(),
    );
    expect(screen.getByText("Translatable Metadata")).toBeInTheDocument();
    expect(screen.queryByText("System Metadata")).not.toBeInTheDocument();
    expect(screen.queryByText("Global Metadata")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Create Translation" }),
    ).toBeInTheDocument();
  });

  test("selects a new language", async () => {
    render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={jest.fn()}
        onObjectCreated={jest.fn()}
        createTranslation={{
          objectType: "Episode",
          objectTypeDisplayName: "Episode",
          objectDisplayName: "GOT S01E01",
          uid: "123",
          language: "en-GB",
          existingLanguages: [],
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Select language and add translatable data."),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Language")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Language"), {
      target: { value: "pt-P" },
    });

    fireEvent.click(screen.getByText("pt-PT"));
  });

  test("shows an error when an existing translation is selected", async () => {
    render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={jest.fn()}
        onObjectCreated={jest.fn()}
        createTranslation={{
          objectType: "Episode",
          objectTypeDisplayName: "Episode",
          objectDisplayName: "GOT S01E01",
          uid: "123",
          language: "en-GB",
          existingLanguages: ["en-GB"],
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Select language and add translatable data."),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Language")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Language"), {
      target: { value: "en-G" },
    });

    fireEvent.click(screen.getByText("en-GB"));

    expect(
      screen.getByText('The language "en-GB" is an existing translation.'),
    ).toBeInTheDocument();
  });

  test("selects a new language, adds a title and creates", async () => {
    const onObjectCreated = jest.fn();

    render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={jest.fn()}
        onObjectCreated={onObjectCreated}
        createTranslation={{
          objectType: "SkylarkSet",
          objectTypeDisplayName: "Set",
          objectDisplayName: "GOT Rail",
          uid: "123",
          language: "en-GB",
          existingLanguages: [],
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Language")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Language"), {
      target: { value: "pt-P" },
    });

    fireEvent.click(screen.getByText("pt-PT"));

    const createButton = screen.getByRole("button", {
      name: "Create Translation",
    });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "GOT Rail Title" },
    });

    expect(createButton).toBeEnabled();

    fireEvent.click(createButton);

    await waitFor(() =>
      expect(onObjectCreated).toHaveBeenCalledWith({
        language: "pt-PT",
        objectType: "SkylarkSet",
        uid: "123",
      }),
    );
  });
});
