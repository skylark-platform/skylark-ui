import { ComponentStory } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { GQLSearchResponse } from "src/hooks/useSearch";
import {
  GQLSkylarkSchemaQueriesMutations,
  GQLSkylarkSearchableObjectsUnionResponse,
} from "src/interfaces/graphql/introspection";
import {
  SkylarkGraphQLObject,
  SkylarkObjectFields,
} from "src/interfaces/skylark/objects";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SEARCHABLE_OBJECTS,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import { GQLSkylarkSchemaQueryFixture } from "src/tests/fixtures";

import { ObjectList } from "./objectListing.component";

export default {
  title: "Components/ObjectListing",
  component: ObjectList,
};

const objectTypes = [
  "Sets",
  "Brand",
  "Season",
  "Episode",
  "Movie",
  "Theme",
  "Genre",
];

const columns = [
  "uid",
  "title",
  "title_short",
  "title_long",
  "synopsis_short",
  "synopsis_long",
];

const searchableObjectsResponse = {
  __type: {
    name: "Searchable",
    possibleTypes: objectTypes.map((name) => ({ name })),
  },
} as GQLSkylarkSearchableObjectsUnionResponse;

const searchableObjects = [
  {
    name: "Episode",
    fields: columns.map((name) => ({
      name,
      type: "string",
      isList: false,
      isRequired: false,
    })),
  },
] as SkylarkObjectFields[];

const skylarkSchemaResponse = {
  __schema: {
    ...GQLSkylarkSchemaQueryFixture.data.__schema,
    queryType: {
      name: "Query",
      fields: [
        {
          name: "getEpisode",
          type: {
            name: "Episode",
            fields: columns.map((name) => ({
              name,
              type: {
                __typename: "",
                name: "String",
                kind: "SCALAR",
                ofType: null,
                enumValues: null,
                fields: [],
                inputFields: [],
              },
            })),
          },
        },
      ],
    },
  },
} as GQLSkylarkSchemaQueriesMutations;

const searchQuery = createSearchObjectsQuery(searchableObjects, ["Episode"]);

const searchResponse = {
  search: {
    objects: Array.from(
      { length: 10 },
      (v, i) =>
        ({
          uid: "xxxx-xxxx-xxxx-xxxx",
          __typename: "Episode",
          external_id: `episode-${i}`,
          title: `Episode ${i}`,
          title_short: "Short title",
          title_long: `${"really ".repeat(5)} long title`,
          synopsis_short: "Short Synopsis",
          synopsis_long: `${"really ".repeat(10)} long synopsis`,
        } as SkylarkGraphQLObject),
    ),
  },
} as GQLSearchResponse;

const Template: ComponentStory<typeof ObjectList> = (args) => {
  return <ObjectList {...args} />;
};

export const Default = Template.bind({});
Default.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: GET_SEARCHABLE_OBJECTS,
        },
        result: {
          data: searchableObjectsResponse,
        },
      },
      {
        request: {
          query: GET_SKYLARK_SCHEMA,
        },
        result: {
          data: skylarkSchemaResponse,
        },
      },
      {
        request: {
          variables: { ignoreAvailability: true, queryString: "" },
          query: searchQuery,
        },
        result: {
          data: searchResponse,
        },
      },
    ],
  },
};

export const WithFiltersOpen = Template.bind({});
WithFiltersOpen.parameters = {
  ...Default.parameters,
};
WithFiltersOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const filtersButton = canvas.getByRole("button");

  await canvas.findAllByText("Short title");

  await userEvent.click(filtersButton);
};

export const WithCreateButtons = Template.bind({});
WithCreateButtons.args = {
  withCreateButtons: true,
};
WithCreateButtons.parameters = {
  ...Default.parameters,
};

export const KitchenSink = Template.bind({});
KitchenSink.args = {
  withCreateButtons: true,
  withObjectSelect: true,
  withObjectEdit: true,
};
KitchenSink.parameters = {
  ...Default.parameters,
};
