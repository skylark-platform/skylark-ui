import { episodeObjectOperations } from "src/__tests__/utils/objectOperations";
import { SkylarkObjectOperations } from "src/interfaces/skylark";

import { createGetObjectQuery, createSearchObjectsQuery } from ".";

describe("createGetObjectQuery", () => {
  test("returns null when the object doesn't have a get operation", () => {
    const got = createGetObjectQuery(null);

    expect(got).toBeNull();
  });

  test("returns expected GraphQL get query", () => {
    const got = createGetObjectQuery(episodeObjectOperations);

    expect(got?.loc?.source.body).toEqual(
      "query GET_Episode ($ignoreAvailability: Boolean = true, $uid: String, $externalId: String) { getObject: getEpisode (ignore_availability: $ignoreAvailability, uid: $uid, external_id: $externalId) { __typename _meta { available_languages language_data { language version } global_data { version } modified { date } created { date } published } _config { primary_field colour display_name field_config { name ui_field_type ui_position } } uid external_id slug synopsis synopsis_short title title_short episode_number internal_title release_date title_sort year_of_release availability (limit: 50) { next_token objects { uid external_id title slug start end timezone } } images (limit: 50) { next_token objects { _meta { available_languages language_data { language version } global_data { version } modified { date } created { date } published } uid external_id slug internal_title title description type alt_text url external_url file_name content_type } } } }",
    );
  });
});

describe("createSearchObjectsQuery", () => {
  test("returns null when no objects are given", () => {
    const got = createSearchObjectsQuery([], {
      typesToRequest: [],
    });

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
          hasContentOf: false,
          hasRelationships: false,
          hasAvailability: true,
          isTranslatable: true,
          isImage: false,
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
          fieldConfig: {
            translatable: ["title", "synopsis"],
            global: [],
          },
          images: null,
          availability: null,
          operations: {} as SkylarkObjectOperations,
          relationships: [],
          hasContent: false,
          hasContentOf: false,
          hasRelationships: false,
          hasAvailability: true,
          isTranslatable: true,
          isImage: false,
        },
      ],
      { typesToRequest: [] },
    );

    expect(got?.loc?.source.body).toEqual(
      `query SEARCH ($language: String, $queryString: String!, $offset: Int, $limit: Int, $dimensions: [UserDimension]) { search (language: $language, query: $queryString, offset: $offset, limit: $limit, dimensions: $dimensions) { __typename total_count objects { ... on Episode { __typename __Episode__title: title __Episode__episode_number: episode_number _meta { available_languages language_data { language version } global_data { version } modified { date } created { date } published } } ... on Brand { __typename __Brand__title: title __Brand__synopsis: synopsis _meta { available_languages language_data { language version } global_data { version } modified { date } created { date } published } } } } }`,
    );
  });
});
