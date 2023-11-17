import { screen, fireEvent, waitFor, within } from "@testing-library/react";

import { allObjectTypes, render } from "src/__tests__/utils/test-utils";

import { ContentModel } from "./contentModel.component";

const renderAndWaitForEditorToLoad = async () => {
  render(<ContentModel />);

  await waitFor(() => {
    expect(screen.getByTestId("content-model-editor")).toBeInTheDocument();
  });

  const withinEditor = within(screen.getByTestId("content-model-editor"));

  expect(withinEditor.getByText("SkylarkSet")).toBeInTheDocument();
  expect(withinEditor.getByText("UI Config")).toBeInTheDocument();
  expect(withinEditor.getByText("Fields")).toBeInTheDocument();
  expect(withinEditor.getByText("Relationships")).toBeInTheDocument();

  const withinUIConfigEditor = within(
    withinEditor.getByTestId("uiconfig-editor"),
  );
  const withinFieldEditor = within(withinEditor.getByTestId("fields-editor"));
  const withinRelationshipEditor = within(
    withinEditor.getByTestId("relationships-editor"),
  );

  return {
    withinEditor,
    withinUIConfigEditor,
    withinFieldEditor,
    withinRelationshipEditor,
  };
};

test("renders the content model", async () => {
  await renderAndWaitForEditorToLoad();

  const withinNavigation = within(
    screen.getByTestId("content-editor-navigation"),
  );

  await Promise.all(
    allObjectTypes.map(async (objectType) => {
      const text = await withinNavigation.findByText(objectType);
      expect(text).toBeInTheDocument();
    }),
  );
});

describe("UI Config", () => {
  test("renders UI Config section", async () => {
    const { withinUIConfigEditor } = await renderAndWaitForEditorToLoad();

    expect(withinUIConfigEditor.getByText("Display name")).toBeInTheDocument();
    expect(withinUIConfigEditor.getByText("Display field")).toBeInTheDocument();
    expect(withinUIConfigEditor.getByText("Colour")).toBeInTheDocument();
    expect(withinUIConfigEditor.getByText("Order")).toBeInTheDocument();
  });

  test("changes UI Config and checks the updated preview", async () => {
    const { withinUIConfigEditor } = await renderAndWaitForEditorToLoad();

    expect(withinUIConfigEditor.getByText("Display name")).toBeInTheDocument();
    expect(withinUIConfigEditor.getByText("Display field")).toBeInTheDocument();
    expect(withinUIConfigEditor.getByText("Colour")).toBeInTheDocument();
    expect(withinUIConfigEditor.getByText("Order")).toBeInTheDocument();

    const preview = within(
      withinUIConfigEditor.getByTestId("uiconfig-editor-preview"),
    );

    // Check initial state of UI Config
    const objectTypePill = preview.getByText("Setˢˡ");
    expect(objectTypePill).toBeInTheDocument();
    expect(objectTypePill.parentElement).toHaveAttribute(
      "style",
      "background-color: rgb(0, 0, 0);",
    );
    expect(
      preview.getByText('Example "internal_title" value'),
    ).toBeInTheDocument();

    // Change UI Config
    fireEvent.change(withinUIConfigEditor.getByPlaceholderText("SkylarkSet"), {
      target: { value: "CustomSetName" },
    });
    fireEvent.click(withinUIConfigEditor.getByPlaceholderText("Select option"));
    fireEvent.click(withinUIConfigEditor.getByText("uid"));
    fireEvent.click(withinUIConfigEditor.getByTestId("colour-picker-button"));
    fireEvent.change(withinUIConfigEditor.getByPlaceholderText("#"), {
      target: { value: "#226DFF" },
    });

    // Check updated state of UI Config
    const updatedObjectTypePill = preview.getByText("CustomSetName");
    expect(updatedObjectTypePill).toBeInTheDocument();
    expect(updatedObjectTypePill.parentElement).toHaveAttribute(
      "style",
      "background-color: rgb(34, 109, 255);",
    );
    expect(preview.getByText('Example "uid" value')).toBeInTheDocument();
  });
});

describe("Fields", () => {
  test("renders Fields section", async () => {
    const { withinFieldEditor } = await renderAndWaitForEditorToLoad();

    // Check types of field headers
    expect(withinFieldEditor.getByText("System")).toBeInTheDocument();
    expect(withinFieldEditor.getByText("Translatable")).toBeInTheDocument();
    expect(withinFieldEditor.getByText("Global")).toBeInTheDocument();

    // Check column headers
    expect(withinFieldEditor.getAllByText("Name")).toHaveLength(3);
    expect(withinFieldEditor.getAllByText("Type")).toHaveLength(3);
    expect(withinFieldEditor.getAllByText("Enum / UI type")).toHaveLength(3);
    expect(withinFieldEditor.getAllByText("Required")).toHaveLength(3);
  });
});

describe("Relationships", () => {
  test("renders Relationships section", async () => {
    const { withinRelationshipEditor } = await renderAndWaitForEditorToLoad();

    // Check column headers
    expect(withinRelationshipEditor.getAllByText("Object Type")).toHaveLength(
      1,
    );
    expect(withinRelationshipEditor.getAllByText("Name")).toHaveLength(1);
    expect(withinRelationshipEditor.getAllByText("Sort Field")).toHaveLength(1);

    const imagesRow = withinRelationshipEditor.getByTestId(
      "relationships-editor-row-images",
    );
    expect(imagesRow).toBeInTheDocument();

    const withinImagesRow = within(imagesRow);
    expect(withinImagesRow.getByText("SkylarkImage")).toBeInTheDocument();
    expect(withinImagesRow.getByText("images")).toBeInTheDocument();

    await waitFor(() => {
      expect(withinImagesRow.getByRole("combobox")).toBeInTheDocument();
    });
    expect(withinImagesRow.getByRole("combobox")).toHaveAttribute(
      "data-value",
      "file_name",
    );
  });
});
