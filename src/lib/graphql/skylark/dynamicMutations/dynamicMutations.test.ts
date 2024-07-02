import {
  episodeObjectOperations,
  setObjectOperations,
} from "src/__tests__/utils/objectOperations";
import {
  AvailabilityStatus,
  ParsedSkylarkObjectContentObject,
} from "src/interfaces/skylark";

import {
  createDeleteObjectMutation,
  createUpdateObjectContentMutation,
} from "./objects";

describe("createDeleteObjectMutation", () => {
  test("returns null when the object doesn't have a delete operation", () => {
    const got = createDeleteObjectMutation(null, true);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL delete mutation on a translatable object", () => {
    const got = createDeleteObjectMutation(episodeObjectOperations, true);

    expect(got?.loc?.source.body).toEqual(
      "mutation SL_UI_DELETE_EPISODE ($uid: String!, $language: String!) { deleteObject: deleteEpisode (uid: $uid, language: $language) { uid } }",
    );
  });

  test("returns expected GraphQL delete mutation on a non-translatable object", () => {
    const got = createDeleteObjectMutation(
      {
        ...episodeObjectOperations,
        isTranslatable: false,
      },
      false,
    );

    expect(got?.loc?.source.body).toEqual(
      "mutation SL_UI_DELETE_EPISODE ($uid: String!) { deleteObject: deleteEpisode (uid: $uid) { uid } }",
    );
  });
});

describe("createUpdateSetContentPositionMutation", () => {
  test("returns null when the object doesn't have an update operation", () => {
    const got = createUpdateObjectContentMutation(null, [], []);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL update mutation when no items are reordered", () => {
    const content: ParsedSkylarkObjectContentObject[] = [
      {
        objectType: "Episode",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 1,
        object: { uid: "episode_1", external_id: "" },
      },
      {
        objectType: "Episode",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 2,
        object: { uid: "episode_2", external_id: "" },
      },
      {
        objectType: "Movie",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 3,
        object: { uid: "movie_1", external_id: "" },
      },
    ];

    const got = createUpdateObjectContentMutation(
      setObjectOperations,
      content,
      content,
    );

    expect(got?.loc?.source.body).toContain(
      `{Episode: {link: [], unlink: [], reposition: [{uid: \"episode_1\", position: 1}, {uid: \"episode_2\", position: 2}]}, Movie: {link: [], unlink: [], reposition: [{uid: \"movie_1\", position: 3}]}`,
    );
  });

  test("returns expected GraphQL update mutation when items are reordered", () => {
    const content: ParsedSkylarkObjectContentObject[] = [
      {
        objectType: "Episode",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 1,
        object: { uid: "episode_1", external_id: "" },
      },
      {
        objectType: "Episode",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 2,
        object: { uid: "episode_2", external_id: "" },
      },
      {
        objectType: "Movie",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 3,
        object: { uid: "movie_1", external_id: "" },
      },
    ];

    const updatedContent: typeof content = [content[1], content[2], content[0]];

    const got = createUpdateObjectContentMutation(
      setObjectOperations,
      content,
      updatedContent,
    );

    expect(got?.loc?.source.body).toContain(
      `{Episode: {link: [], unlink: [], reposition: [{uid: \"episode_2\", position: 1}, {uid: \"episode_1\", position: 3}]}, Movie: {link: [], unlink: [], reposition: [{uid: \"movie_1\", position: 2}]}`,
    );
  });

  test("returns expected GraphQL update mutation when an item is removed", () => {
    const content: ParsedSkylarkObjectContentObject[] = [
      {
        objectType: "Episode",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 1,
        object: { uid: "episode_1", external_id: "" },
      },
      {
        objectType: "Episode",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 2,
        object: { uid: "episode_2", external_id: "" },
      },
      {
        objectType: "Movie",
        config: { fieldConfig: [] },
        meta: {
          language: "en-GB",
          availableLanguages: ["en-GB"],
          availabilityStatus: AvailabilityStatus.Active,
          versions: {},
        },
        position: 3,
        object: { uid: "movie_1", external_id: "" },
      },
    ];

    const updatedContent: typeof content = [content[2], content[0]];

    const got = createUpdateObjectContentMutation(
      setObjectOperations,
      content,
      updatedContent,
    );

    expect(got?.loc?.source.body).toContain(
      `{Movie: {link: [], unlink: [], reposition: [{uid: \"movie_1\", position: 1}]}, Episode: {link: [], unlink: [\"episode_2\"], reposition: [{uid: \"episode_1\", position: 2}]}`,
    );
  });
});
