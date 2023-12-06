import { graphql } from "msw";

export const updateSchemaHandlers = [
  graphql.mutation(`UPDATE_RELATIONSHIP_CONFIG_SkylarkSet`, (req, res, ctx) => {
    return res(
      ctx.data({
        SkylarkSet_assets: {
          default_sort_field: "title_sort",
        },
        SkylarkSet_call_to_actions: {
          default_sort_field: "uid",
        },
        SkylarkSet_images: {
          default_sort_field: "file_name",
        },
        SkylarkSet_tags: {
          default_sort_field: "name_sort",
        },
        SkylarkSet_credits: {
          default_sort_field: "position",
        },
      }),
    );
  }),

  graphql.mutation("UPDATE_OBJECT_TYPE_CONFIG", (req, res, ctx) => {
    return res(
      ctx.data({
        setObjectTypeConfiguration: {
          display_name: "Setˢˡ",
          primary_field: "internal_title",
          colour: "#000000",
          field_config: [
            {
              name: "release_date",
              ui_field_type: null,
              ui_position: 11,
            },
            {
              name: "title_sort",
              ui_field_type: null,
              ui_position: 12,
            },
            {
              name: "title_short",
              ui_field_type: null,
              ui_position: 5,
            },
            {
              name: "internal_title",
              ui_field_type: null,
              ui_position: 10,
            },
            {
              name: "description",
              ui_field_type: "TEXTAREA",
              ui_position: 8,
            },
            {
              name: "synopsis_short",
              ui_field_type: "TEXTAREA",
              ui_position: 7,
            },
            {
              name: "synopsis",
              ui_field_type: "TEXTAREA",
              ui_position: 6,
            },
            {
              name: "title",
              ui_field_type: null,
              ui_position: 4,
            },
            {
              name: "uid",
              ui_field_type: null,
              ui_position: 1,
            },
            {
              name: "external_id",
              ui_field_type: null,
              ui_position: 2,
            },
            {
              name: "type",
              ui_field_type: null,
              ui_position: 3,
            },
            {
              name: "slug",
              ui_field_type: null,
              ui_position: 9,
            },
          ],
        },
      }),
    );
  }),
];
