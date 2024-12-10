import { waitFor, screen, fireEvent, within } from "@testing-library/react";
import {
  DefaultBodyType,
  GraphQLContext,
  MockedRequest,
  ResponseResolver,
  graphql,
} from "msw";

import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkUserAccountFixture from "src/__tests__/fixtures/skylark/queries/getUserAndAccount.json";
import { server } from "src/__tests__/mocks/server";
import { render } from "src/__tests__/utils/test-utils";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";
import { createDefaultSkylarkObject } from "src/lib/skylark/objects";

import { CreateObjectModal } from "./createObjectModal.component";

const saveGraphQLError: ResponseResolver<
  MockedRequest<DefaultBodyType>,
  GraphQLContext<Record<string, unknown>>
> = (_, res, ctx) => {
  return res(ctx.errors([{ errorType: "error", message: "invalid input" }]));
};

const validateErrorToastShown = async (message: string) => {
  await waitFor(() => expect(screen.getByTestId("toast")).toBeInTheDocument());
  const withinToast = within(screen.getByTestId("toast"));
  expect(withinToast.getByText(message)).toBeInTheDocument();
  expect(withinToast.getByText("Reason(s):")).toBeInTheDocument();
  expect(withinToast.getByText("- invalid input")).toBeInTheDocument();
};

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

    await user.click(screen.getByTestId("select"));

    await waitFor(() =>
      expect(screen.queryAllByText("Episode")).toHaveLength(1),
    );
    await user.click(screen.getByText("Episode"));

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
        GQLSkylarkUserAccountFixture.data.getAccount.config.default_language,
      objectType: "Episode",
      uid: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid,
    });
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  test("adds a field value and saves, but GraphQL returns an error", async () => {
    server.use(
      graphql.mutation(
        wrapQueryName("CREATE_OBJECT_Episode"),
        saveGraphQLError,
      ),
    );

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

    await user.click(screen.getByTestId("select"));

    await waitFor(() =>
      expect(screen.queryAllByText("Episode")).toHaveLength(1),
    );
    await user.click(screen.getByText("Episode"));

    await waitFor(() =>
      expect(screen.queryAllByText("External id")).toHaveLength(1),
    );

    const createButton = screen.getByRole("button", { name: "Create Episode" });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText("External id"), "my-external-id");

    await waitFor(() => expect(createButton).not.toBeDisabled());

    await user.click(createButton);

    await validateErrorToastShown("Error creating object");

    expect(onObjectCreated).not.toHaveBeenCalled();
    expect(setIsOpen).not.toHaveBeenCalled();
  });

  test("uses AI field generation to suggest values for synopsis", async () => {
    const setIsOpen = jest.fn();

    const { user } = render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={setIsOpen}
        onObjectCreated={jest.fn()}
      />,
    );

    await screen.findByTestId("create-object-modal");

    await user.click(screen.getByTestId("select"));

    await waitFor(() =>
      expect(screen.queryAllByText("Episode")).toHaveLength(1),
    );
    await user.click(screen.getByText("Episode"));

    await waitFor(() =>
      expect(screen.queryAllByText("External id")).toHaveLength(1),
    );

    const title = await screen.findByLabelText("Title");
    await user.type(title, "GOT S01E01");

    const synopsis = await screen.findByLabelText("Synopsis");
    expect(synopsis).toHaveValue("");

    const aiFieldGenerationButton = await within(
      synopsis.parentElement as HTMLElement,
    ).findByTestId("ai-field-fill");

    await user.click(aiFieldGenerationButton);

    await waitFor(() => {
      expect(synopsis).toHaveValue("Winter is Coming");
    });

    // Validate it cycles around values
    await user.click(aiFieldGenerationButton);
    await waitFor(() => {
      expect(synopsis).toHaveValue(
        "Winter is Coming - Series Premiere. Lord Ned Stark is troubled by disturbing reports from a Night's Watch deserter; King Robert and the Lannisters arrive at Winterfell; Viserys Targaryen forges a new alliance.",
      );
    });
  });

  test("uses Complete with AI Suggestions Button", async () => {
    const setIsOpen = jest.fn();

    const { user } = render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={setIsOpen}
        onObjectCreated={jest.fn()}
      />,
    );

    await screen.findByTestId("create-object-modal");

    await user.click(screen.getByTestId("select"));

    await waitFor(() =>
      expect(screen.queryAllByText("Episode")).toHaveLength(1),
    );
    await user.click(screen.getByText("Episode"));

    await waitFor(() =>
      expect(screen.queryAllByText("External id")).toHaveLength(1),
    );

    const title = await screen.findByLabelText("Title");
    await user.type(title, "GOT S01E01");

    const fieldsToCheck = [
      "Synopsis",
      "Synopsis short",
      "Release date",
      "Title short",
      "Slug",
    ];

    await Promise.all(
      fieldsToCheck.map(async (label) => {
        const el = await screen.findByLabelText(label);
        expect(el).toHaveValue("");
      }),
    );

    const aiFieldGenerationButton = await screen.findByText(
      "Complete with AI suggestions",
    );
    await user.click(aiFieldGenerationButton);

    await Promise.all(
      fieldsToCheck.map(async (label) => {
        const el = await screen.findByLabelText(label);
        await waitFor(() => {
          expect(el).not.toHaveValue("");
        });
      }),
    );
  });
});

describe("Create Translation (existing object)", () => {
  test("when createTranslation object is passed it displays only translation data", async () => {
    render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={jest.fn()}
        onObjectCreated={jest.fn()}
        createTranslation={createDefaultSkylarkObject({
          objectType: "Episode",
          display: { name: "GOT S01E01" },
          uid: "123",
          language: "en-GB",
        })}
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
        createTranslation={createDefaultSkylarkObject({
          objectType: "Episode",
          display: { name: "GOT S01E01" },
          uid: "123",
          language: "en-GB",
        })}
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

    fireEvent.mouseDown(screen.getByText("pt-PT"));
  });

  test("shows an error when an existing translation is selected", async () => {
    render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={jest.fn()}
        onObjectCreated={jest.fn()}
        createTranslation={createDefaultSkylarkObject({
          objectType: "Episode",
          display: { name: "GOT S01E01" },
          uid: "123",
          language: "en-GB",
          availableLanguages: ["en-GB"],
        })}
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

    fireEvent.mouseDown(screen.getByText("en-GB"));

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
        createTranslation={createDefaultSkylarkObject({
          objectType: "SkylarkSet",
          display: { name: "GOT Rail", objectType: "Set" },
          uid: "123",
          language: "en-GB",
          availableLanguages: [],
        })}
      />,
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Language")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Language"), {
      target: { value: "pt-P" },
    });

    fireEvent.mouseDown(screen.getByText("pt-PT"));

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

  test("selects a new language, adds a title and creates, but GraphQL returns an error", async () => {
    server.use(
      graphql.mutation(
        wrapQueryName("UPDATE_OBJECT_METADATA_SkylarkSet"),
        saveGraphQLError,
      ),
    );

    const onObjectCreated = jest.fn();

    render(
      <CreateObjectModal
        isOpen={true}
        setIsOpen={jest.fn()}
        onObjectCreated={onObjectCreated}
        createTranslation={createDefaultSkylarkObject({
          objectType: "SkylarkSet",
          display: { name: "GOT Rail", objectType: "Set" },
          uid: "123",
          language: "en-GB",
          availableLanguages: [],
        })}
      />,
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Language")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Language"), {
      target: { value: "pt-P" },
    });

    fireEvent.mouseDown(screen.getByText("pt-PT"));

    const createButton = screen.getByRole("button", {
      name: "Create Translation",
    });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "GOT Rail Title" },
    });

    expect(createButton).toBeEnabled();

    fireEvent.click(createButton);

    await validateErrorToastShown(`Error creating "pt-PT" translation`);

    expect(onObjectCreated).not.toHaveBeenCalled();
  });
});
