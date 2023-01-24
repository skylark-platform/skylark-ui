import { ComponentStory } from "@storybook/react";
import { DocumentNode } from "graphql";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import { getAllSearchableObjectsMeta } from "src/lib/skylark/objects";
import Index from "src/pages/index";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";
import GQLSkylarkSearchableObjectsQueryFixture from "src/tests/fixtures/skylark/queries/introspection/searchableUnion.json";
import GQLGameOfThronesSearchResults from "src/tests/fixtures/skylark/queries/search/got.json";

export default {
  title: "Pages/Index",
  component: Index,
};

const searchableObjectTypes =
  GQLSkylarkSearchableObjectsQueryFixture.data.__type.possibleTypes.map(
    ({ name }) => name,
  ) || [];
const searchableObjectsMeta = getAllSearchableObjectsMeta(
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
  searchableObjectTypes,
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
          query: GET_SEARCHABLE_OBJECTS,
        },
        result: GQLSkylarkSearchableObjectsQueryFixture,
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
