import { StoryFn, Meta } from "@storybook/react";

import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";

import { ContentModel } from "./contentModel.component";

const meta: Meta = {
  title: "Components/ContentModel",
  component: ContentModel,
  decorators: [
    (StoryComponent) => (
      // Padding-top aligns everything as it will be on the content model page with sticky headers in action
      <div className="h-screen w-screen pt-24">
        <StoryComponent />
      </div>
    ),
  ],
};

export default meta;

const Template: StoryFn = () => {
  return (
    <ContentModel
      objectType={BuiltInSkylarkObjectType.SkylarkSet}
      activeSchemaVersionNumber={0}
      schemaVersionNumber={0}
    />
  );
};

export const Default = {
  render: Template,
  args: {},

  parameters: {
    nextjs: {
      router: {
        query: {
          objectType: ["SkylarkSet"],
        },
      },
    },
  },
};
