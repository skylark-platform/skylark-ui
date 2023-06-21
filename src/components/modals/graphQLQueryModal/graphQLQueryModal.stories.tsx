import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { DisplayGraphQLQuery } from "./graphQLQueryModal.component";

export default {
  title: "Components/Modals/DisplayGraphQLQuery",
  component: DisplayGraphQLQuery,
};

const Template: ComponentStory<typeof DisplayGraphQLQuery> = (args) => (
  <DisplayGraphQLQuery {...args} />
);

export const Default = Template.bind({});
Default.args = {
  label: "Schema",
  query: GET_SKYLARK_OBJECT_TYPES,
  variables: {
    variable1: "value1",
  },
};
Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const graphqlButton = canvas.getByRole("button");

  await userEvent.click(graphqlButton);

  await waitFor(async () => {
    canvas.findAllByText("Query for Schema");
  });
};
