import { ComponentStory } from "@storybook/react";
import { within } from "@storybook/testing-library";

import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import Index from "src/pages/index";
import {
  GQLSkylarkSearchableObjectsQueryFixture,
  GQLSkylarkSchemaQueryFixture,
  GQLSkylarkSearchQueryFixture,
  GQLSkylarkDynamicSearchQuery,
} from "src/tests/fixtures";

export default {
  title: "Pages/Index",
  component: Index,
};

const Template: ComponentStory<typeof Index> = () => {
  return <Index />;
};

export const IndexPage = Template.bind({});
IndexPage.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: GET_SEARCHABLE_OBJECTS,
        },
        result: {
          data: GQLSkylarkSearchableObjectsQueryFixture,
        },
      },
      {
        request: {
          query: GET_SKYLARK_SCHEMA,
        },
        result: {
          data: GQLSkylarkSchemaQueryFixture.data,
        },
      },
      {
        request: {
          variables: { ignoreAvailability: true, queryString: "" },
          query: GQLSkylarkDynamicSearchQuery,
        },
        result: {
          data: GQLSkylarkSearchQueryFixture,
        },
      },
    ],
  },
};
IndexPage.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);

  await canvas.findAllByText("Short title");
};
