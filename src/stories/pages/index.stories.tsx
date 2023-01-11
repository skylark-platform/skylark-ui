import { SkylarkObjectFields } from "src/interfaces/skylark/objects";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import Index from "src/pages/index";
import {
  SKYLARK_OBJECT_FIELDS_FIXTURE,
  GQLSkylarkSearchableObjectsQueryFixture,
  GQLSkylarkSchemaQueryFixture,
  GQLSkylarkSearchQueryFixture,
} from "src/tests/fixtures";

export default {
  title: "Pages/Index",
  component: Index,
};

const searchableObjects = [
  {
    name: "Episode",
    fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
      name,
      type: "string",
      isList: false,
      isRequired: false,
    })),
  },
] as SkylarkObjectFields[];
const searchQuery = createSearchObjectsQuery(searchableObjects, ["Episode"]);

export const IndexPage = () => <Index />;
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
          query: searchQuery,
        },
        result: {
          data: GQLSkylarkSearchQueryFixture,
        },
      },
    ],
  },
};
