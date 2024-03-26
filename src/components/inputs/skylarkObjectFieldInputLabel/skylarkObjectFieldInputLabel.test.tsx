import {
  fireEvent,
  prettyDOM,
  render,
  screen,
} from "src/__tests__/utils/test-utils";

import {
  SkylarkObjectFieldInputLabel,
  SkylarkObjectFieldInputLabelProps,
  createHtmlForId,
} from "./skylarkObjectFieldInputLabel.component";

const defaultProps: SkylarkObjectFieldInputLabelProps = {
  field: "title",
  hasValue: false,
  idPrefix: "test",
};

test("renders default label", async () => {
  render(<SkylarkObjectFieldInputLabel {...defaultProps} />);

  const title = screen.getByText("Title");

  expect(title).toHaveAttribute(
    "for",
    createHtmlForId(defaultProps.idPrefix, defaultProps.field),
  );
});

test("renders anchor tag when href is given", async () => {
  render(
    <SkylarkObjectFieldInputLabel {...defaultProps} href="/mycustomdomain" />,
  );

  const links = screen.getByRole("link");

  expect(links).toHaveAttribute("href", "/mycustomdomain");
});

test("renders copy value button when copyValue is given", async () => {
  render(
    <SkylarkObjectFieldInputLabel {...defaultProps} copyValue="my text" />,
  );

  const copyButton = screen.getByLabelText("Copy my text to clipboard");

  expect(copyButton).toBeInTheDocument();
});

describe("with AI Field generation props", () => {
  const aiFieldGeneration = {
    isGeneratingAiSuggestions: false,
    hasAiSuggestions: true,
    formHasValues: true,
    generateFieldSuggestions: jest.fn(),
    fieldIsAiSuggestion: jest.fn().mockReturnValue(false),
    populateAllFieldsUsingAiValues: jest.fn(),
    populateFieldUsingAiValue: jest.fn(),
  };

  test("renders the ai field generation icon when aiFieldGeneration props are given", async () => {
    render(
      <SkylarkObjectFieldInputLabel
        {...defaultProps}
        aiFieldGeneration={aiFieldGeneration}
      />,
    );

    const aiGenerationIcon = screen.getByTestId("ai-field-fill");

    expect(aiGenerationIcon).toBeInTheDocument();
  });

  test("ai generation icon is enabled and calls populateFieldUsingAiValue when field doesn't have a value, the form does have values and we're not generating values", async () => {
    const populateFieldUsingAiValue = jest.fn();

    render(
      <SkylarkObjectFieldInputLabel
        {...defaultProps}
        aiFieldGeneration={{ ...aiFieldGeneration, populateFieldUsingAiValue }}
      />,
    );

    const aiGenerationIcon = screen.getByTestId("ai-field-fill");

    expect(aiGenerationIcon).toBeEnabled();

    await fireEvent.click(aiGenerationIcon);
    expect(populateFieldUsingAiValue).toHaveBeenCalled();
  });

  test("tooltip shows generating loading text when isGeneratingAiSuggestions is true", async () => {
    const { user } = render(
      <SkylarkObjectFieldInputLabel
        {...defaultProps}
        aiFieldGeneration={{
          ...aiFieldGeneration,
          isGeneratingAiSuggestions: true,
        }}
      />,
    );

    const aiGenerationIcon = screen.getByTestId("ai-field-fill");

    const tooltipTrigger = aiGenerationIcon.parentElement as HTMLElement;
    tooltipTrigger.setAttribute("data-state", "open");
    await user.hover(tooltipTrigger);

    const foundText = await screen.findAllByText(/Generating AI suggestions/);
    expect(foundText.length).toBeGreaterThanOrEqual(1);
  });

  test("tooltip shows this field will be used when generating text when the field has a value", async () => {
    const { user } = render(
      <SkylarkObjectFieldInputLabel
        {...defaultProps}
        hasValue
        aiFieldGeneration={{
          ...aiFieldGeneration,
        }}
      />,
    );

    const aiGenerationIcon = screen.getByTestId("ai-field-fill");

    const tooltipTrigger = aiGenerationIcon.parentElement as HTMLElement;
    tooltipTrigger.setAttribute("data-state", "open");
    await user.hover(tooltipTrigger);

    const foundText = await screen.findAllByText(
      /This field will be used when generating AI suggestions./,
    );
    expect(foundText.length).toBeGreaterThanOrEqual(1);
  });

  test("uses refresh button to call generateFieldSuggestions", async () => {
    const generateFieldSuggestions = jest.fn();

    const { user } = render(
      <SkylarkObjectFieldInputLabel
        {...defaultProps}
        hasValue
        aiFieldGeneration={{
          ...aiFieldGeneration,
          generateFieldSuggestions,
        }}
      />,
    );

    const aiGenerationIcon = screen.getByTestId("ai-field-fill");

    const tooltipTrigger = aiGenerationIcon.parentElement as HTMLElement;
    tooltipTrigger.setAttribute("data-state", "open");
    await user.hover(tooltipTrigger);

    const refreshButton = await screen.findAllByText(/Refresh suggestions/);
    await fireEvent.click(refreshButton[0]);

    expect(generateFieldSuggestions).toHaveBeenCalled();
  });

  test("tooltip shows help text when form has values but this input does not", async () => {
    const { user } = render(
      <SkylarkObjectFieldInputLabel
        {...defaultProps}
        aiFieldGeneration={{
          ...aiFieldGeneration,
        }}
      />,
    );

    const aiGenerationIcon = screen.getByTestId("ai-field-fill");

    const tooltipTrigger = aiGenerationIcon.parentElement as HTMLElement;
    tooltipTrigger.setAttribute("data-state", "open");
    await user.hover(tooltipTrigger);

    const foundText = await screen.findAllByText(
      /Click on the wand to populate the field using AI generated values./,
    );
    expect(foundText.length).toBeGreaterThanOrEqual(1);
  });

  test("tooltip shows help text when form does not have values", async () => {
    const { user } = render(
      <SkylarkObjectFieldInputLabel
        {...defaultProps}
        aiFieldGeneration={{
          ...aiFieldGeneration,
          formHasValues: false,
        }}
      />,
    );

    const aiGenerationIcon = screen.getByTestId("ai-field-fill");

    const tooltipTrigger = aiGenerationIcon.parentElement as HTMLElement;
    tooltipTrigger.setAttribute("data-state", "open");
    await user.hover(tooltipTrigger);

    const foundText = await screen.findAllByText(
      /Populate fields to enable AI suggestions./,
    );
    expect(foundText.length).toBeGreaterThanOrEqual(1);
  });
});
