import { gql } from "@apollo/client";

import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectMetadata,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";

import {
  createDeleteObjectMutation,
  createUpdateSetContentPositionMutation,
} from "./dynamicMutations";

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

describe("createDeleteObjectMutation", () => {
  test("returns null when the object doesn't have a delete operation", () => {
    const got = createDeleteObjectMutation(null);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL delete mutation", () => {
    const got = createDeleteObjectMutation(object);

    expect(got).toEqual(
      gql(
        `
      mutation DELETE_Episode ($uid: String!) { deleteObject: deleteEpisode (uid: $uid) { uid } }
      `,
      ),
    );
  });
});

describe("createUpdateSetContentPositionMutation", () => {
  test("returns null when the object doesn't have an update operation", () => {
    const got = createUpdateSetContentPositionMutation(null, []);

    expect(got).toBeNull();
  });

  test("returns null when no content is supplied", () => {
    const got = createUpdateSetContentPositionMutation(object, []);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL update mutation", () => {
    const content: {
      objectType: string;
      config: ParsedSkylarkObjectConfig;
      object: ParsedSkylarkObjectMetadata;
      position: number;
    }[] = [
      {
        objectType: "Episode",
        config: {},
        position: 1,
        object: { uid: "episode_1", external_id: "" },
      },
      {
        objectType: "Episode",
        config: {},
        position: 2,
        object: { uid: "episode_2", external_id: "" },
      },
      {
        objectType: "Movie",
        config: {},
        position: 3,
        object: { uid: "movie_1", external_id: "" },
      },
    ];

    const got = createUpdateSetContentPositionMutation(object, content);

    expect(got).toEqual(
      gql(
        `
        mutation UPDATE_OBJECT_CONTENT_Episode ($uid: String!) { updateObjectContentPositioning: updateEpisode (uid: $uid, episode: {content: {Episode: {reposition: [{uid: "episode_1", position: 1}, {uid: "episode_2", position: 2}]}, Movie: {reposition: [{uid: "movie_1", position: 3}]}}}) { uid } }
      `,
      ),
    );
  });
});
