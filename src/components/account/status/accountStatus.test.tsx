import { graphql } from "msw";

import GQLSkylarkAccountStatusAvailabilityBackgroundTasksFixture from "src/__tests__/fixtures/skylark/queries/getAccountStatus/availabilityBackgroundTasksInProgress.json";
import GQLSkylarkAccountStatusBackgroundTasksFixture from "src/__tests__/fixtures/skylark/queries/getAccountStatus/backgroundTasksInProgress.json";
import GQLSkylarkAccountStatusDefault from "src/__tests__/fixtures/skylark/queries/getAccountStatus/default.json";
import GQLSkylarkAccountStatusDeletionBackgroundTasksFixture from "src/__tests__/fixtures/skylark/queries/getAccountStatus/deletionBackgroundTasksInProgress.json";
import GQLSkylarkAccountStatusSchemaUpdate from "src/__tests__/fixtures/skylark/queries/getAccountStatus/schemaUpdateInProgress.json";
import { server } from "src/__tests__/mocks/server";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";
import { GET_ACCOUNT_STATUS } from "src/lib/graphql/skylark/queries";

import { AccountStatus } from "./accountStatus.component";

test("renders showing Availability processing", async () => {
  server.use(
    graphql.query(GET_ACCOUNT_STATUS, (req, res, ctx) => {
      return res(
        ctx.data(
          GQLSkylarkAccountStatusAvailabilityBackgroundTasksFixture.data,
        ),
      );
    }),
  );

  render(<AccountStatus />);

  await waitFor(() => {
    expect(
      screen.getByText("Processing 51 Availability Rules"),
    ).toBeInTheDocument();
  });
});

test("renders showing Delete processing", async () => {
  server.use(
    graphql.query(GET_ACCOUNT_STATUS, (req, res, ctx) => {
      return res(
        ctx.data(GQLSkylarkAccountStatusDeletionBackgroundTasksFixture.data),
      );
    }),
  );

  render(<AccountStatus />);

  await waitFor(() => {
    expect(
      screen.getByText("Processing 3 Deletion Requests"),
    ).toBeInTheDocument();
  });
});

test("renders showing Background tasks processing when more than one task_type exist", async () => {
  server.use(
    graphql.query(GET_ACCOUNT_STATUS, (req, res, ctx) => {
      return res(ctx.data(GQLSkylarkAccountStatusBackgroundTasksFixture.data));
    }),
  );

  render(<AccountStatus />);

  await waitFor(() => {
    expect(
      screen.getByText("Processing 20 Background Tasks"),
    ).toBeInTheDocument();
  });
});

test("renders showing Data Model Updating when a Schema update is in progress", async () => {
  server.use(
    graphql.query(GET_ACCOUNT_STATUS, (req, res, ctx) => {
      return res(ctx.data(GQLSkylarkAccountStatusSchemaUpdate.data));
    }),
  );

  render(<AccountStatus />);

  await waitFor(() => {
    expect(
      screen.getByText("Data Model Update In Progress"),
    ).toBeInTheDocument();
  });
});

test("renders successful message when all have finished and clears using the tick", async () => {
  jest.useFakeTimers();

  let count = 0;

  server.use(
    graphql.query(GET_ACCOUNT_STATUS, (req, res, ctx) => {
      if (count > 0) {
        return res(ctx.data(GQLSkylarkAccountStatusDefault.data));
      }

      count += 1;
      return res(ctx.data(GQLSkylarkAccountStatusSchemaUpdate.data));
    }),
  );

  render(<AccountStatus />);

  await waitFor(() => {
    expect(
      screen.getByText("Data Model Update In Progress"),
    ).toBeInTheDocument();
  });

  jest.advanceTimersByTime(5000);

  await waitFor(() => {
    expect(
      screen.getByText("All Background Tasks Completed"),
    ).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByLabelText("Clear Background Task Status"));

  expect(
    screen.queryByText("All Background Tasks Completed"),
  ).not.toBeInTheDocument();
});
