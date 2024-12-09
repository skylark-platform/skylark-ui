import { StoryFn, Meta } from "@storybook/react";

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
  return <ContentModel />;
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
