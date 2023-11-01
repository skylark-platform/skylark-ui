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
import { screen, waitFor, within } from "src/__tests__/utils/test-utils";
import { PanelTab, PanelTabState } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";

export const movieObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectQueryFixture.data.getObject.uid,
  objectType: "Movie",
  language:
    GQLSkylarkGetObjectQueryFixture.data.getObject._meta.language_data.language,
};

export const draftMovieObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetMovieDraftQueryFixture.data.getObject.uid,
  objectType: "Movie",
  language:
    GQLSkylarkGetMovieDraftQueryFixture.data.getObject._meta.language_data
      .language,
};

export const imageObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid,
  objectType: "SkylarkImage",
  language: "en-GB",
};

export const episodeObjectEnGB: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid,
  objectType: "Episode",
  language: "en-GB",
};

export const episodeObjectPtPT: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture.data.getObject.uid,
  objectType: "Episode",
  language: "pt-PT",
};

export const setObjectWithContent: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid,
  objectType: "SkylarkSet",
  language: "en-GB",
};

export const seasonWithRelationships: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.uid,
  objectType: "Season",
  language: "en-GB",
};

export const availabilityObject: SkylarkObjectIdentifier = {
  uid: GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid,
  objectType: BuiltInSkylarkObjectType.Availability,
  language: "",
};

const tabState: PanelTabState = {
  Relationships: {
    expanded: {},
  },
};

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
