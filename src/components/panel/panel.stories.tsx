import { ComponentStory } from "@storybook/react";
import { DocumentNode } from "graphql";
import React from "react";

import { SkylarkObjectMeta } from "src/interfaces/skylark/objects";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";
import {
  GQLSkylarkSchemaQueryFixture,
  SKYLARK_OBJECT_FIELDS_FIXTURE,
} from "src/tests/fixtures";
import { GQLSkylarkGetObjectQueryFixture } from "src/tests/fixtures/panel.fixture";

import { Panel } from "./panel.component";

export default {
  title: "Components/Panel",
  component: Panel,
  argTypes: {},
};

const Template: ComponentStory<typeof Panel> = (args) => {
  return (
    <div className="flex flex-row space-x-2">
      <Panel
        objectType="Episode"
        uid={GQLSkylarkGetObjectQueryFixture.data.getObject.uid}
        closePanel={() => false}
      />
    </div>
  );
};

export const Default = Template.bind({});

const object = {
  name: "Episode",
  fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
    enumValues: undefined,
    isList: false,
    isRequired: false,
    name,
    type: "string",
  })),
  operations: {
    get: {
      name: "getEpisode",
      type: "Query",
    },
  },
};

Default.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: createGetObjectQuery(
            object as SkylarkObjectMeta,
          ) as DocumentNode,
          variables: {
            ignoreAvailability: true,
            uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
          },
        },
        result: GQLSkylarkGetObjectQueryFixture,
      },
      {
        request: {
          query: GET_SKYLARK_SCHEMA,
        },
        result: GQLSkylarkSchemaQueryFixture,
      },
    ],
  },
};
