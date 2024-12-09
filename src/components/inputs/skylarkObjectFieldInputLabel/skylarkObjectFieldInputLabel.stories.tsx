import { StoryFn } from "@storybook/react";

import {
  SkylarkObjectFieldInputLabel,
  SkylarkObjectFieldInputLabelProps,
} from "./skylarkObjectFieldInputLabel.component";

export default {
  title: "Components/Inputs/Labels/SkylarkObjectFieldInputLabel",
  component: SkylarkObjectFieldInputLabel,
};

const defaultProps: SkylarkObjectFieldInputLabelProps = {
  field: "title",
  hasValue: false,
  idPrefix: "test",
};

const aiFieldGeneration = {
  isGeneratingAiSuggestions: false,
  hasAiSuggestions: true,
  formHasValues: true,
  generateFieldSuggestions: () => "",
  fieldIsAiSuggestion: () => false,
  populateAllFieldsUsingAiValues: () => "",
  populateFieldUsingAiValue: () => "",
};

const Template: StoryFn = ({ ...props }) => {
  return <SkylarkObjectFieldInputLabel {...defaultProps} {...props} />;
};

export const Default = {
  render: Template,
  args: {},
};

export const WithHref = {
  render: Template,
  args: {
    href: "/example",
  },
};

export const WithAIGeneration = {
  render: Template,
  args: {
    aiFieldGeneration,
  },
};

export const WithAll = {
  render: Template,
  args: {
    href: "/example",
    isRequired: true,
    aiFieldGeneration,
  },
};
