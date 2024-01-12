import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import {
  allObjectTypes,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

beforeEach(() => {
  const router = { query: { objectType: ["SkylarkSet"] }, push: jest.fn() };
  useRouter.mockReturnValue(router);
});

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

    server.use(
      graphql.query("GET_OBJECTS_CONFIG", (req, res, ctx) => {
        return res(
          ctx.data({
            SkylarkSet: {
              primary_field: "uid",
              colour: "#226DFF",
              display_name: "CustomSetName",
              field_config: [
                {
                  name: "release_date",
                  ui_field_type: null,
                  ui_position: 6,
                },
                {
                  name: "title_sort",
                  ui_field_type: null,
                  ui_position: 7,
                },
                {
                  name: "title_short",
                  ui_field_type: null,
                  ui_position: 2,
                },
                {
                  name: "internal_title",
                  ui_field_type: null,
                  ui_position: 0,
                },
                {
                  name: "description",
                  ui_field_type: "TEXTAREA",
                  ui_position: 5,
                },
                {
                  name: "synopsis_short",
                  ui_field_type: "TEXTAREA",
                  ui_position: 4,
                },
                {
                  name: "synopsis",
                  ui_field_type: "TEXTAREA",
                  ui_position: 3,
                },
                {
                  name: "title",
                  ui_field_type: null,
                  ui_position: 1,
                },
              ],
            },
          }),
        );
      }),
    );

    // Save
    fireEvent.click(screen.getByText("Save"));

    // Check success toast
    await waitFor(() => {
      screen.getByText("Object Type config updated");
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

  test("changes UI Config and saves", async () => {
    const { withinUIConfigEditor } = await renderAndWaitForEditorToLoad();

    const preview = within(
      withinUIConfigEditor.getByTestId("uiconfig-editor-preview"),
    );

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

  test("changes Relationship config and saves", async () => {
    const { withinRelationshipEditor } = await renderAndWaitForEditorToLoad();

    const imagesRow = withinRelationshipEditor.getByTestId(
      "relationships-editor-row-images",
    );
    expect(imagesRow).toBeInTheDocument();

    const withinImagesRow = within(imagesRow);

    await waitFor(() => {
      expect(withinImagesRow.getByRole("combobox")).toBeInTheDocument();
    });

    const imageSortField = withinImagesRow.getByRole("combobox");
    const imageInheritAvailability = withinImagesRow.getByRole("checkbox");

    // Change sort field
    expect(imageSortField).toHaveAttribute("data-value", "file_name");
    fireEvent.click(imageSortField);
    fireEvent.click(withinImagesRow.getByText("title"));
    expect(imageSortField).toHaveAttribute("data-value", "title");

    // Change inherit availability
    expect(imageInheritAvailability).not.toBeChecked();
    fireEvent.click(imageInheritAvailability);
    expect(imageInheritAvailability).toBeChecked();

    server.use(
      graphql.query(
        "LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION",
        (req, res, ctx) => {
          return res(
            ctx.data({
              listRelationshipConfiguration: [
                {
                  relationship_name: "images",
                  config: {
                    default_sort_field: "title",
                    inherit_availability: true,
                  },
                },
              ],
            }),
          );
        },
      ),
    );

    // Save
    fireEvent.click(screen.getByText("Save"));

    // Check success toast
    await waitFor(() => {
      screen.getByText("Relationship config updated");
    });

    // Revalidate the relationship config to ensure it hasn't changed
    expect(imageSortField).toHaveAttribute("data-value", "title");
    expect(imageInheritAvailability).toBeChecked();
  });

  test("saves relationship config but Skylark returns an unknown error", async () => {
    const { withinRelationshipEditor } = await renderAndWaitForEditorToLoad();

    const imagesRow = withinRelationshipEditor.getByTestId(
      "relationships-editor-row-images",
    );
    expect(imagesRow).toBeInTheDocument();

    const withinImagesRow = within(imagesRow);

    await waitFor(() => {
      expect(withinImagesRow.getByRole("combobox")).toBeInTheDocument();
    });

    // Change sort field
    const imageSortField = withinImagesRow.getByRole("combobox");
    expect(imageSortField).toHaveAttribute("data-value", "file_name");
    fireEvent.click(imageSortField);
    fireEvent.click(withinImagesRow.getByText("title"));
    expect(imageSortField).toHaveAttribute("data-value", "title");

    server.use(
      graphql.mutation(
        wrapQueryName("UPDATE_RELATIONSHIP_CONFIG_SkylarkSet"),
        (req, res, ctx) => {
          return res(
            ctx.errors([
              {
                message: "random error",
                locations: [
                  {
                    line: 2,
                    column: 3,
                  },
                ],
                path: ["SkylarkSet_assets"],
                data: null,
                errorType: "InvalidInput",
                errorInfo: null,
              },
            ]),
          );
        },
      ),
    );

    // Save
    fireEvent.click(screen.getByText("Save"));

    // Check error toasts
    await waitFor(() => {
      expect(
        screen.getByText("Relationship config update failed"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Error when updating the Relationship config."),
    ).toBeInTheDocument();
    expect(screen.getByText("Please try again later.")).toBeInTheDocument();
    expect(screen.getByText("- random error")).toBeInTheDocument();
  });

  test("saves relationship config but Skylark returns an inherit availability error", async () => {
    const { withinRelationshipEditor } = await renderAndWaitForEditorToLoad();

    const imagesRow = withinRelationshipEditor.getByTestId(
      "relationships-editor-row-images",
    );
    expect(imagesRow).toBeInTheDocument();

    const withinImagesRow = within(imagesRow);

    await waitFor(() => {
      expect(withinImagesRow.getByRole("combobox")).toBeInTheDocument();
    });

    // Change sort field
    const imageSortField = withinImagesRow.getByRole("combobox");
    expect(imageSortField).toHaveAttribute("data-value", "file_name");
    fireEvent.click(imageSortField);
    fireEvent.click(withinImagesRow.getByText("title"));
    expect(imageSortField).toHaveAttribute("data-value", "title");

    server.use(
      graphql.mutation(
        wrapQueryName("UPDATE_RELATIONSHIP_CONFIG_SkylarkSet"),
        (req, res, ctx) => {
          return res(
            ctx.errors([
              {
                message: "Reverse relationship already inherits",
                locations: [
                  {
                    line: 2,
                    column: 3,
                  },
                ],
                path: ["SkylarkSet_assets"],
                data: null,
                errorType: "InvalidInput",
                errorInfo: null,
              },
              {
                message: "Reverse relationship already inherits",
                locations: [
                  {
                    line: 2,
                    column: 3,
                  },
                ],
                path: ["SkylarkSet_brands"],
                data: null,
                errorType: "InvalidInput",
                errorInfo: null,
              },
            ]),
          );
        },
      ),
    );

    // Save
    fireEvent.click(screen.getByText("Save"));

    // Check error toasts
    await waitFor(() => {
      expect(
        screen.getByText("Relationship config update failed"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'Cannot enable "inherit availability" on the following relationships as it is enabled on the reverse relationship.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("- assets")).toBeInTheDocument();
    expect(screen.getByText("- brands")).toBeInTheDocument();
  });
});
