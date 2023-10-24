import {
  hasMatchingQuery,
  hasMatchingVariable,
  hasOperationName,
} from "../../../../support/utils/graphqlTestUtils";

export const allDevicesAllCustomersAvailability =
  "Always - All devices, all non-kids customer types";

export const assetOnlyQuery =
  "query SEARCH($ignoreAvailability: Boolean = true, $queryString: String!) {\n  search(\n    ignore_availability: $ignoreAvailability\n    query: $queryString\n    limit: 1000\n  ) {\n    __typename\n    objects {\n      ... on Asset {\n        __typename\n        uid\n        external_id\n        __Asset__slug: slug\n        __Asset__title: title\n        __Asset__type: type\n        __Asset__url: url\n      }\n      __typename\n    }\n  }\n}";

export const configurePanelSkylarkIntercepts = () => {
  cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
    if (hasOperationName(req, "IntrospectionQuery")) {
      req.alias = "introspectionQuery";
      req.reply({
        fixture: "./skylark/queries/introspection/introspectionQuery.json",
      });
    }
    if (hasOperationName(req, "GET_USER_AND_ACCOUNT")) {
      req.reply({
        fixture: "./skylark/queries/getUserAndAccount.json",
      });
    }
    if (hasOperationName(req, "GET_ACCOUNT_STATUS")) {
      req.reply({
        fixture: "./skylark/queries/getAccountStatus/default.json",
      });
    }
    if (hasOperationName(req, "GET_OBJECTS_CONFIG")) {
      req.reply({
        fixture: "./skylark/queries/getObjectsConfig/allObjectsConfig.json",
      });
    }
    if (hasOperationName(req, "LIST_AVAILABILITY_DIMENSIONS")) {
      req.reply({
        fixture: "./skylark/queries/listDimensions.json",
      });
    }
    if (hasOperationName(req, "LIST_AVAILABILITY_DIMENSION_VALUES")) {
      req.reply({
        fixture: "./skylark/queries/listDimensionValues.json",
      });
    }
    if (hasOperationName(req, "GET_Episode")) {
      if (hasMatchingVariable(req, "language", "pt-PT")) {
        req.reply({
          fixture: "./skylark/queries/getObject/gots01e01ptPT.json",
        });
      } else {
        req.reply({
          fixture: "./skylark/queries/getObject/gots01e01.json",
        });
      }
    }
    if (hasOperationName(req, "GET_SkylarkSet")) {
      req.reply({
        fixture: "./skylark/queries/getObject/homepage.json",
      });
    }
    if (hasOperationName(req, "GET_SkylarkSet_CONTENT")) {
      req.reply({
        fixture: "./skylark/queries/getObjectContent/homepage.json",
      });
    }
    if (hasOperationName(req, "GET_SkylarkSet_RELATIONSHIPS")) {
      req.reply({
        fixture: "./skylark/queries/getObjectRelationships/homepage.json",
      });
    }
    if (hasOperationName(req, "GET_Movie")) {
      req.reply({
        fixture:
          "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
      });
    }
    if (hasOperationName(req, "GET_Movie_AVAILABILITY")) {
      req.reply({
        fixture:
          "./skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json",
      });
    }
    if (hasOperationName(req, "GET_Movie_CONTENT_OF")) {
      req.reply({
        fixture:
          "./skylark/queries/getObjectContentOf/fantasticMrFox_All_Availabilities.json",
      });
    }
    if (hasOperationName(req, "GET_Availability")) {
      req.reply({
        fixture:
          "./skylark/queries/getObject/allDevicesAllCustomersAvailability.json",
      });
    }
    if (hasOperationName(req, "GET_AVAILABILITY_DIMENSIONS")) {
      req.reply({
        fixture:
          "./skylark/queries/getObjectDimensions/allDevicesAllCustomersAvailability.json",
      });
    }
    if (hasOperationName(req, "DELETE_Episode")) {
      req.reply({
        data: {
          deleteObject: {
            uid: "01GX396FF5MFFZ5N8YYPAM4W03",
          },
        },
      });
    }
    if (hasOperationName(req, "SEARCH")) {
      if (hasMatchingVariable(req, "queryString", "got winter is coming")) {
        req.reply({
          fixture: "./skylark/queries/search/gotWinterIsComing.json",
        });
      } else if (hasMatchingVariable(req, "queryString", "Homepage")) {
        req.reply({
          fixture: "./skylark/queries/search/homepage.json",
        });
      } else if (
        hasMatchingVariable(req, "queryString", "all avail test movie")
      ) {
        req.reply({
          fixture:
            "./skylark/queries/search/fantasticMrFox_All_Availabilities.json",
        });
      } else if (
        hasMatchingVariable(
          req,
          "queryString",
          allDevicesAllCustomersAvailability,
        )
      ) {
        req.reply({
          fixture:
            "./skylark/queries/search/allDevicesAllCustomersAvailability.json",
        });
      } else if (hasMatchingQuery(req, assetOnlyQuery)) {
        req.reply({
          fixture: "./skylark/queries/search/gotAssetsOnly.json",
        });
      } else {
        req.reply({
          fixture: "./skylark/queries/search/gotPage1.json",
        });
      }
    }
    if (hasOperationName(req, "UPDATE_OBJECT_CONTENT_SkylarkSet")) {
      req.alias = "updateHomepageSetContent";
      req.reply({
        fixture: "./skylark/mutations/updateHomepageSetContent.json",
      });
    }
    if (hasOperationName(req, "UPDATE_OBJECT_METADATA_Episode")) {
      const updateObjectMetadataData = {
        __typename: "Episode",
        _config: { primary_field: "title", colour: "#ff7ba8" },
        _meta: {
          available_languages: ["en-GB", "pt-PT"],
          language_data: { language: "en-GB", version: 1 },
          global_data: { version: 2 },
          published: true,
        },
        uid: "01GX396FF5MFFZ5N8YYPAM4W03",
        external_id: "recAZhG0fPFgamb8I",
        slug: "winter-is-coming",
        synopsis_long:
          "North of the Seven Kingdoms of Westeros, Night's Watch soldiers are attacked by supernatural White Walkers. One soldier escapes but is captured at Castle Winterfell. Eddard \"Ned\" Stark, Warden of the North, executes him for desertion. Later, six orphaned dire wolf pups are found and one given to each Stark sibling, including Ned's bastard son, Jon Snow. In King's Landing, the Seven Kingdoms capital, Jon Arryn, the Hand of the King, dies suddenly. King Robert Baratheon, Ned's old friend, travels to Winterfell to recruit Ned and propose a marriage between his heir Joffrey and Ned's daughter, Sansa. Lysa Arryn, Jon's widow, sends her sister (Ned's wife), Catelyn, a letter claiming the Lannisters, Queen Cersei's family, murdered Arryn. Catelyn believes the Lannisters are now plotting against King Robert. Ned's young son, Brandon, climbs a tall tower and witnesses Cersei and her twin brother, Jaime Lannister, inside having sex. To hide their incest, Jaime pushes Bran from the high window. Across the Narrow Sea in Essos, exiled Prince Viserys Targaryen forces his sister, Daenerys, to marry the Dothraki warlord, Drogo, in exchange for an army to conquer Westeros and reclaim the Iron Throne. Robert Baratheon became king after Jaime Lannister killed \"Mad\" King Aerys Targaryen, earning Jaime the nickname, \"The King Slayer\". The ancient Targaryens once commanded dragons, and Daenerys is given three fossilized dragon eggs as a wedding gift.",
        synopsis_medium:
          "Series Premiere. Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon; Viserys plans to wed his sister to a nomadic warlord in exchange for an army.",
        synopsis_short: null,
        title: "GOT S01E1 - Winter is Coming",
        title_long: null,
        title_medium: null,
        title_short: "Winter is Coming",
        episode_number: 1,
        release_date: "2011-04-17",
      };
      if (hasMatchingVariable(req, "draft", true)) {
        req.alias = "updateEpisodeMetadataDraft";
        req.reply({
          data: {
            updateObjectMetadata: {
              ...updateObjectMetadataData,
              _meta: {
                ...updateObjectMetadataData._meta,
                published: false,
              },
            },
          },
        });
      } else {
        req.alias = "updateEpisodeMetadata";
        req.reply({
          data: {
            updateObjectMetadata: {
              ...updateObjectMetadataData,
              _meta: {
                ...updateObjectMetadataData._meta,
                published: true,
              },
            },
          },
        });
      }
    }
    if (hasOperationName(req, "UPDATE_AVAILABILITY_DIMENSIONS")) {
      req.alias = "updateAvailabilityDimensions";
      req.reply({
        data: {
          updateAvailabilityDimensions: {
            uid: "123",
          },
        },
      });
    }
  });
};