import { ComponentStory } from "@storybook/react";
import { DocumentNode } from "graphql";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SKYLARK_OBJECT_TYPES,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import { getAllObjectsMeta } from "src/lib/skylark/objects";
import Index from "src/pages/index";
import GQLSkylarkObjectTypesQueryFixture from "src/tests/fixtures/skylark/queries/introspection/objectTypes.json";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";
import GQLGameOfThronesSearchResults from "src/tests/fixtures/skylark/queries/search/got.json";

export default {
  title: "Pages/Index",
  component: Index,
};

const objectTypes =
  GQLSkylarkObjectTypesQueryFixture.data.__type.possibleTypes.map(
    ({ name }) => name,
  ) || [];
const searchableObjectsMeta = getAllObjectsMeta(
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
  objectTypes,
);

const Template: ComponentStory<typeof Index> = () => {
  return <Index />;
};

export const IndexPage = Template.bind({});
IndexPage.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: GET_SKYLARK_OBJECT_TYPES,
        },
        result: GQLSkylarkObjectTypesQueryFixture,
      },
      {
        request: {
          query: GET_SKYLARK_SCHEMA,
        },
        result: GQLSkylarkSchemaQueryFixture,
      },
      {
        request: {
          variables: { ignoreAvailability: true, queryString: "" },
          query: createSearchObjectsQuery(
            searchableObjectsMeta,
            [],
          ) as DocumentNode,
        },
        result: GQLGameOfThronesSearchResults,
      },
    ],
  },
};
