import { gql } from "@apollo/client";

import {
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
} from "src/interfaces/skylark/objects";

import {
  createGetObjectQuery,
  createListObjectQuery,
  createSearchObjectsQuery,
} from "./dynamicQueries";

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
  availability: null,
  images: null,
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
      argName: "episode",
      name: "createEpisode",
      inputs: fields,
    },
    update: {
      type: "Mutation",
      argName: "episode",
      name: "updateEpisode",
      inputs: fields,
    },
    delete: {
      type: "Mutation",
      argName: "",
      name: "deleteEpisode",
      inputs: [],
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
      query GET_Episode ($ignoreAvailability: Boolean = true, $uid: String, $externalId: String) { getObject: getEpisode (ignore_availability: $ignoreAvailability, uid: $uid, external_id: $externalId) { name type } }
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
        query LIST_Episode ($ignoreAvailability: Boolean = true, $nextToken: String) { listSkylarkObjects: listEpisode (ignore_availability: $ignoreAvailability, limit: 50, next_token: $nextToken) { count next_token objects { name type } } }
      `,
      ),
    );
  });
});

describe("createSearchObjectsQuery", () => {
  test("returns null when no objects are given", () => {
    const got = createSearchObjectsQuery([], []);

    expect(got).toBeNull();
  });

  test("returns expected query with aliases", () => {
    const got = createSearchObjectsQuery(
      [
        {
          name: "Episode",
          fields: [
            {
              name: "title",
              type: "string",
              isList: false,
              isRequired: true,
            },
            {
              name: "episode_number",
              type: "int",
              isList: false,
              isRequired: false,
            },
          ],
          // TODO use real images, availability and operations
          images: null,
          availability: null,
          operations: {} as SkylarkObjectOperations,
        },
        {
          name: "Brand",
          fields: [
            {
              name: "title",
              type: "string",
              isList: false,
              isRequired: true,
            },
            {
              name: "synopsis",
              type: "string",
              isList: false,
              isRequired: false,
            },
          ],
          images: null,
          availability: null,
          operations: {} as SkylarkObjectOperations,
        },
      ],
      [],
    );

    expect(got).toEqual(
      gql(`
        query SEARCH ($ignoreAvailability: Boolean = true, $queryString: String!) { search (ignore_availability: $ignoreAvailability, query: $queryString, limit: 1000) { __typename objects { ... on Episode { __typename __Episode__title: title __Episode__episode_number: episode_number } ... on Brand { __typename __Brand__title: title __Brand__synopsis: synopsis } } } }
      `),
    );
  });
});
