import { gql } from "@apollo/client";

import {
  NormalizedObjectField,
  SkylarkObjectMeta,
} from "src/interfaces/skylark/objects";

import { createGetObjectQuery, createListObjectQuery } from "./dynamicQueries";

const fields: NormalizedObjectField[] = [
  {
    name: "name",
    type: "string",
    isList: false,
    isRequired: false,
  },
  {
    name: "type",
    type: "enum",
    isList: false,
    isRequired: false,
  },
];

const object: SkylarkObjectMeta = {
  name: "Episode",
  fields: fields,
  operations: {
    get: {
      type: "Query",
      name: "getEpisode",
    },
    list: {
      type: "Query",
      name: "listEpisode",
    },
    create: {
      type: "Mutation",
      name: "createEpisode",
      inputs: fields,
    },
  },
};

describe("createGetObjectQuery", () => {
  test("returns null when the object doesn't have a get operation", () => {
    const got = createGetObjectQuery(null);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL get query", () => {
    const got = createGetObjectQuery(object);

    expect(got).toEqual(
      gql(
        `
      query ($ignoreAvailability: Boolean = true, $uid: String, $externalId: String) { getEpisode (ignore_availability: $ignoreAvailability, uid: $uid, external_id: $externalId) { name type } }
      `,
      ),
    );
  });
});

describe("createListObjectQuery", () => {
  test("returns null when the object doesn't have a get operation", () => {
    const got = createListObjectQuery(null);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL get query", () => {
    const got = createListObjectQuery(object);

    expect(got).toEqual(
      gql(
        `
        query ($ignoreAvailability: Boolean = true, $nextToken: String) { listSkylarkObjects: listEpisode (ignore_availability: $ignoreAvailability, limit: 50, next_token: $nextToken) { count next_token objects { name type } } }
      `,
      ),
    );
  });
});
