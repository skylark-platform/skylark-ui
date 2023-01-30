import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";

import { GraphQLQueryModal } from "./graphQLQueryModal.component";

export default {
  title: "Components/DisplayGraphQLQuery",
  component: GraphQLQueryModal,
};

const Template: ComponentStory<typeof GraphQLQueryModal> = (args) => (
  <GraphQLQueryModal {...args} />
);

export const Default = Template.bind({});
Default.args = {
  label: "Schema",
  query: GET_SKYLARK_SCHEMA,
  variables: {
    variable1: "value1",
  },
  closeModal: () => alert("closed clicked"),
};
