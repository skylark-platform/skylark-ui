import { ComponentStory, Story } from "@storybook/react";

import { ContentModel } from "./contentModel.component";

export default {
  title: "Components/ContentModel",
  component: ContentModel,
  // Decorator to increase Story height https://www.chromatic.com/docs/snapshots#why-are-components-that-render-in-a-portal-tooltip-modal-menu-ge
  decorators: [
    (StoryComponent: Story) => (
      // Padding-top aligns everything as it will be on the content model page with sticky headers in action
      <div className="h-screen w-screen pt-24">
        <StoryComponent />
      </div>
    ),
  ],
};

const Template: ComponentStory<typeof ContentModel> = () => {
  return <ContentModel />;
};

export const Default = Template.bind({});
Default.args = {};
Default.parameters = {
  nextjs: {
    router: {
      query: {
        objectType: ["SkylarkSet"],
      },
    },
  },
};
