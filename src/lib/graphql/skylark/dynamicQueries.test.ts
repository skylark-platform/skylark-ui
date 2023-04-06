import {
  episodeObjectOperations,
  setObjectOperations,
} from "src/__tests__/utils/objectOperations";
import { SkylarkObjectOperations } from "src/interfaces/skylark";

import {
  createGetObjectQuery,
  createSearchObjectsQuery,
} from "./dynamicQueries";

describe("createGetObjectQuery", () => {
  test("returns null when the object doesn't have a get operation", () => {
    const got = createGetObjectQuery(null, []);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL get query", () => {
    const got = createGetObjectQuery(episodeObjectOperations, []);

    expect(got?.loc?.source.body).toEqual(
      "query GET_Episode ($ignoreAvailability: Boolean = true, $uid: String, $externalId: String) { getObject: getEpisode (ignore_availability: $ignoreAvailability, uid: $uid, external_id: $externalId) { __typename _config { primary_field colour } _meta { available_languages language_data { language version } global_data { version } } uid external_id slug synopsis_long synopsis_medium synopsis_short title title_long title_medium title_short episode_number release_date availability (limit: 50) { next_token objects { uid external_id title slug start end timezone } } images (limit: 50) { next_token objects { uid external_id slug title description type url external_url upload_url download_from_url file_name content_type } } } }",
    );
  });

  test("returns expected GraphQL get query with content", () => {
    const got = createGetObjectQuery(setObjectOperations, [
      episodeObjectOperations,
    ]);

    expect(got?.loc?.source.body).toContain(
      "content (order: ASC, limit: 50) { objects { object { ... on Episode",
    );
    expect(got?.loc?.source.body).toEqual(
      "query GET_SkylarkSet ($ignoreAvailability: Boolean = true, $uid: String, $externalId: String) { getObject: getSkylarkSet (ignore_availability: $ignoreAvailability, uid: $uid, external_id: $externalId) { __typename _config { primary_field colour } _meta { available_languages language_data { language version } global_data { version } } uid slug external_id type title synopsis_short synopsis_medium synopsis_long title_short title_medium title_long release_date description availability (limit: 50) { next_token objects { uid external_id title slug start end timezone } } images (limit: 50) { next_token objects { uid external_id slug title description type url external_url upload_url download_from_url file_name content_type } } content (order: ASC, limit: 50) { objects { object { ... on Episode { __typename _config { primary_field colour } uid external_id __Episode__slug: slug __Episode__synopsis_long: synopsis_long __Episode__synopsis_medium: synopsis_medium __Episode__synopsis_short: synopsis_short __Episode__title: title __Episode__title_long: title_long __Episode__title_medium: title_medium __Episode__title_short: title_short __Episode__episode_number: episode_number __Episode__release_date: release_date } } position } } } }",
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
              originalType: "String",
              isList: false,
              isRequired: true,
            },
            {
              name: "episode_number",
              type: "int",
              originalType: "Int",
              isList: false,
              isRequired: false,
            },
          ],
          fieldConfig: {
            translatable: ["title"],
            global: ["episode_number"],
          },
          // TODO use real images, availability and operations
          images: null,
          availability: null,
          operations: {} as SkylarkObjectOperations,
          relationships: [],
          hasContent: false,
          hasRelationships: false,
          hasAvailability: true,
          isTranslatable: true,
        },
        {
          name: "Brand",
          fields: [
            {
              name: "title",
              type: "string",
              originalType: "String",
              isList: false,
              isRequired: true,
            },
            {
              name: "synopsis",
              type: "string",
              originalType: "String",
              isList: false,
              isRequired: false,
            },
          ],
          images: null,
          availability: null,
          operations: {} as SkylarkObjectOperations,
          relationships: [],
          hasContent: false,
          hasRelationships: false,
          hasAvailability: true,
          isTranslatable: true,
        },
      ],
      [],
    );

    expect(got?.loc?.source.body).toEqual(
      `query SEARCH ($ignoreAvailability: Boolean = true, $language: String, $queryString: String!, $offset: Int, $limit: Int) { search (ignore_availability: $ignoreAvailability, language: $language, query: $queryString, offset: $offset, limit: $limit) { __typename objects { ... on Episode { __typename _config { primary_field colour } _meta { available_languages language_data { language version } global_data { version } } __Episode__title: title __Episode__episode_number: episode_number } ... on Brand { __typename _config { primary_field colour } _meta { available_languages language_data { language version } global_data { version } } __Brand__title: title __Brand__synopsis: synopsis } } } }`,
    );
  });
});
