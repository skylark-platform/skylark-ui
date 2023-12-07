import { ComponentStory } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
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

const Template: ComponentStory<typeof AccountStatus> = () => <AccountStatus />;

const sleep = (timeMs: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

export const ProcessingAvailabilities = Template.bind({});
ProcessingAvailabilities.parameters = {
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
};

export const ProcessingMultipleBackgroundTasks = Template.bind({});
ProcessingMultipleBackgroundTasks.parameters = {
  msw: {
    handlers: {
      status: graphql.query(`SL_UI_GET_ACCOUNT_STATUS`, (req, res, ctx) => {
        return res(
          ctx.data(GQLSkylarkAccountStatusBackgroundTasksFixture.data),
        );
      }),
    },
  },
};

export const UpdatingSchema = Template.bind({});
UpdatingSchema.parameters = {
  msw: {
    handlers: {
      status: graphql.query(`SL_UI_GET_ACCOUNT_STATUS`, (req, res, ctx) => {
        return res(ctx.data(GQLSkylarkAccountStatusSchemaUpdate.data));
      }),
    },
  },
};

// Successful account status only shows after an in progress task has completed
let calls = 0;
export const AfterBackgroundTasksFinished = Template.bind({});
AfterBackgroundTasksFinished.parameters = {
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
};
AfterBackgroundTasksFinished.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // Allow a second request to happen
  await sleep(10000);

  await waitFor(async () => {
    await canvas.findByText("All Background Tasks Completed");
  });
};

export const Tooltip = Template.bind({});
Tooltip.parameters = {
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
};
Tooltip.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    await userEvent.hover(
      canvas.getByText("Processing 50+ Availability Rules"),
    );
  });

  await sleep(1000);

  await canvas.findAllByText(/When objects/);
};
