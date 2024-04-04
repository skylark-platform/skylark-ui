import { StoryFn } from "@storybook/react";
import { screen, userEvent, waitFor } from "@storybook/testing-library";
import { graphql } from "msw";

import GQLSkylarkAccountStatusAvailabilityBackgroundTasksFixture from "src/__tests__/fixtures/skylark/queries/getAccountStatus/availabilityBackgroundTasksInProgress.json";
import GQLSkylarkAccountStatusBackgroundTasksFixture from "src/__tests__/fixtures/skylark/queries/getAccountStatus/backgroundTasksInProgress.json";
import GQLSkylarkAccountStatusDefault from "src/__tests__/fixtures/skylark/queries/getAccountStatus/default.json";
import GQLSkylarkAccountStatusSchemaUpdate from "src/__tests__/fixtures/skylark/queries/getAccountStatus/schemaUpdateInProgress.json";

import { AccountStatus } from "./accountStatus.component";

export default {
  title: "Components/Account/Status",
  component: AccountStatus,
};

const Template: StoryFn<typeof AccountStatus> = () => <AccountStatus />;

const sleep = (timeMs: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

export const ProcessingAvailabilities = {
  render: Template,

  parameters: {
    msw: {
      handlers: {
        status: graphql.query(`SL_UI_GET_ACCOUNT_STATUS`, (req, res, ctx) => {
          return res(
            ctx.data(
              GQLSkylarkAccountStatusAvailabilityBackgroundTasksFixture.data,
            ),
          );
        }),
      },
    },
  },
};

export const ProcessingMultipleBackgroundTasks = {
  render: Template,

  parameters: {
    msw: {
      handlers: {
        status: graphql.query(`SL_UI_GET_ACCOUNT_STATUS`, (req, res, ctx) => {
          return res(
            ctx.data(GQLSkylarkAccountStatusBackgroundTasksFixture.data),
          );
        }),
      },
    },
  },
};

export const UpdatingSchema = {
  render: Template,

  parameters: {
    msw: {
      handlers: {
        status: graphql.query(`SL_UI_GET_ACCOUNT_STATUS`, (req, res, ctx) => {
          return res(ctx.data(GQLSkylarkAccountStatusSchemaUpdate.data));
        }),
      },
    },
  },
};

// Successful account status only shows after an in progress task has completed
let calls = 0;

export const AfterBackgroundTasksFinished = {
  render: Template,

  parameters: {
    msw: {
      handlers: {
        status: graphql.query(`SL_UI_GET_ACCOUNT_STATUS`, (req, res, ctx) => {
          if (calls > 0) {
            return res(ctx.data(GQLSkylarkAccountStatusDefault.data));
          }

          calls += 1;
          return res(ctx.data(GQLSkylarkAccountStatusSchemaUpdate.data));
        }),
      },
    },
  },

  play: async () => {
    // Allow a second request to happen
    await sleep(10000);

    await waitFor(async () => {
      await screen.findByText("All Background Tasks Completed");
    });
  },
};

export const Tooltip = {
  render: Template,

  parameters: {
    msw: {
      handlers: {
        status: graphql.query(`SL_UI_GET_ACCOUNT_STATUS`, (req, res, ctx) => {
          return res(
            ctx.data(
              GQLSkylarkAccountStatusAvailabilityBackgroundTasksFixture.data,
            ),
          );
        }),
      },
    },
  },

  play: async () => {
    await waitFor(async () => {
      await userEvent.hover(
        screen.getByText("Processing 51 Availability Rules"),
      );
    });

    await sleep(1000);

    await screen.findAllByText(/When objects/);
  },
};
