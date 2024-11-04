import {
  DefaultBodyType,
  GraphQLContext,
  MockedRequest,
  ResponseResolver,
} from "msw";

import GQLSkylarkGetAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetMovieDraftQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/draftObject.json";
import GQLSkylarkGetObjectQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01ptPT.json";
import GQLSkylarkGetSeasonWithRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import GQLSkylarkGetSkylarkAssetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/skylarkAsset.json";
import { screen, waitFor, within } from "src/__tests__/utils/test-utils";
import { PanelTab, PanelTabState, defaultPanelTabState } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  SkylarkObject,
} from "src/interfaces/skylark";
import { createDefaultSkylarkObject } from "src/lib/skylark/objects";

export const movieObject: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
  objectType: "Movie",
  language:
    GQLSkylarkGetObjectQueryFixture.data.getObject._meta.language_data.language,
});

export const draftMovieObject: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetMovieDraftQueryFixture.data.getObject.uid,
  objectType: "Movie",
  language:
    GQLSkylarkGetMovieDraftQueryFixture.data.getObject._meta.language_data
      .language,
});

export const imageObject: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid,
  objectType: "SkylarkImage",
  language: "en-GB",
});

export const episodeObjectEnGB: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid,
  objectType: "Episode",
  language: "en-GB",
});

export const episodeObjectPtPT: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture.data.getObject.uid,
  objectType: "Episode",
  language: "pt-PT",
});

export const setObjectWithContent: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid,
  objectType: "SkylarkSet",
  language: "en-GB",
});

export const seasonWithRelationships: SkylarkObject =
  createDefaultSkylarkObject({
    uid: GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.uid,
    objectType: "Season",
    language: "en-GB",
  });

export const availabilityObject: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid,
  objectType: BuiltInSkylarkObjectType.Availability,
  language: "",
});

export const skylarkAssetObject: SkylarkObject = createDefaultSkylarkObject({
  uid: GQLSkylarkGetSkylarkAssetQueryFixture.data.getObject.uid,
  objectType: BuiltInSkylarkObjectType.SkylarkAsset,
  language: "en-GB",
});

const tabState: PanelTabState = { ...defaultPanelTabState };

export const defaultProps = {
  closePanel: jest.fn(),
  setPanelObject: jest.fn(),
  setTab: jest.fn(),
  updateActivePanelTabState: jest.fn(),
  tab: PanelTab.Metadata,
  tabState,
};

export const saveGraphQLError: ResponseResolver<
  MockedRequest<DefaultBodyType>,
  GraphQLContext<Record<string, unknown>>
> = (_, res, ctx) => {
  return res(ctx.errors([{ errorType: "error", message: "invalid input" }]));
};

export const validateErrorToastShown = async () => {
  await waitFor(() => expect(screen.getByTestId("toast")).toBeInTheDocument());
  const withinToast = within(screen.getByTestId("toast"));
  expect(withinToast.getByText("Error saving changes")).toBeInTheDocument();
  expect(withinToast.getByText("Reason(s):")).toBeInTheDocument();
  expect(withinToast.getByText("- invalid input")).toBeInTheDocument();
};
