import {
  episodeObjectOperations,
  setObjectOperations,
} from "src/__tests__/utils/objectOperations";
import {
  AvailabilityStatus,
  SkylarkObjectContentObject,
  SkylarkObject,
} from "src/interfaces/skylark";
import { createDefaultSkylarkObject } from "src/lib/skylark/objects";

import {
  createDeleteObjectMutation,
  createUpdateObjectContentMutation,
} from "./objects";

const obj: SkylarkObject = createDefaultSkylarkObject({
  uid: "",
  objectType: "",
});

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
    const got = createUpdateObjectContentMutation(null, [], [], null);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL update mutation when no items are reordered", () => {
    const content: SkylarkObjectContentObject[] = [
      {
        ...obj,
        objectType: "Episode",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 1,
        isDynamic: false,
        uid: "episode_1",
      },
      {
        ...obj,
        objectType: "Episode",
        uid: "episode_2",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 2,
        isDynamic: false,
      },
      {
        ...obj,
        objectType: "Movie",
        uid: "movie_1",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 3,
        isDynamic: true,
      },
    ];

    const got = createUpdateObjectContentMutation(
      setObjectOperations,
      content,
      content,
      null,
    );

    expect(got?.loc?.source.body).toContain(
      `{Episode: {link: [], unlink: [], reposition: [{uid: \"episode_1\", position: 1}, {uid: \"episode_2\", position: 2}]}, Movie: {link: [], unlink: [], reposition: [{uid: \"movie_1\", position: 3}]}`,
    );
  });

  test("returns expected GraphQL update mutation when items are reordered", () => {
    const content: SkylarkObjectContentObject[] = [
      {
        ...obj,
        objectType: "Episode",
        uid: "episode_1",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 1,
        isDynamic: false,
      },
      {
        ...obj,
        objectType: "Episode",
        uid: "episode_2",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 2,
        isDynamic: false,
      },
      {
        ...obj,
        objectType: "Movie",
        uid: "movie_1",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 3,
        isDynamic: true,
      },
    ];

    const updatedContent: typeof content = [content[1], content[2], content[0]];

    const got = createUpdateObjectContentMutation(
      setObjectOperations,
      content,
      updatedContent,
      null,
    );

    expect(got?.loc?.source.body).toContain(
      `{Episode: {link: [], unlink: [], reposition: [{uid: \"episode_2\", position: 1}, {uid: \"episode_1\", position: 3}]}, Movie: {link: [], unlink: [], reposition: [{uid: \"movie_1\", position: 2}]}`,
    );
  });

  test("returns expected GraphQL update mutation when an item is removed", () => {
    const content: SkylarkObjectContentObject[] = [
      {
        ...obj,
        objectType: "Episode",
        uid: "episode_1",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 1,
        isDynamic: false,
      },
      {
        ...obj,
        objectType: "Episode",
        uid: "episode_2",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 2,
        isDynamic: false,
      },
      {
        ...obj,
        objectType: "Movie",
        uid: "movie_1",
        // config: { fieldConfig: [] },
        // meta: {
        //   language: "en-GB",
        //   availableLanguages: ["en-GB"],
        //   availabilityStatus: AvailabilityStatus.Active,
        //   versions: {},
        // },
        position: 3,
        isDynamic: true,
      },
    ];

    const updatedContent: typeof content = [content[2], content[0]];

    const got = createUpdateObjectContentMutation(
      setObjectOperations,
      content,
      updatedContent,
      null,
    );

    expect(got?.loc?.source.body).toContain(
      `{Movie: {link: [], unlink: [], reposition: [{uid: \"movie_1\", position: 1}]}, Episode: {link: [], unlink: [\"episode_2\"], reposition: [{uid: \"episode_1\", position: 2}]}`,
    );
  });
});
