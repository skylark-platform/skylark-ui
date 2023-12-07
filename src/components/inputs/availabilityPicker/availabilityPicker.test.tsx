import { graphql } from "msw";

import { server } from "src/__tests__/mocks/server";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";
import { UTC_NAME } from "src/components/inputs/select";
import { GQLSkylarkListAvailabilityDimensionsResponse } from "src/interfaces/skylark";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

import { AvailabilityPicker } from "./availabilityPicker.component";

const selectAllDimensions = async () => {
  // Select device type
  const deviceTypeSelect = screen.getByPlaceholderText(
    "Select Device Type value",
  );
  await waitFor(() => {
    expect(deviceTypeSelect).toBeEnabled();
  });
  fireEvent.click(deviceTypeSelect);
  fireEvent.click(screen.getByText("PC"));

  // Select device type
  const customerTypeSelect = screen.getByPlaceholderText(
    "Select Customer Type value",
  );
  expect(customerTypeSelect).toBeEnabled();
  fireEvent.click(customerTypeSelect);
  fireEvent.click(screen.getByText("Premium"));
};

test("opens the Availability Picker when the button is clicked", async () => {
  render(
    <AvailabilityPicker
      activeValues={{ dimensions: null, timeTravel: null }}
      setActiveAvailability={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByTestId("open-availability-picker"));

  await waitFor(() => {
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
  });
  expect(screen.getByText("Time travel")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("Device type")).toBeInTheDocument();
    expect(screen.getByText("Customer type")).toBeInTheDocument();
  });
});

test("selects dimensions and saves", async () => {
  const setActiveAvailability = jest.fn();

  render(
    <AvailabilityPicker
      activeValues={{ dimensions: null, timeTravel: null }}
      setActiveAvailability={setActiveAvailability}
    />,
  );

  fireEvent.click(screen.getByTestId("open-availability-picker"));

  await waitFor(() => {
    expect(screen.getByText("Device type")).toBeInTheDocument();
    expect(screen.getByText("Customer type")).toBeInTheDocument();
  });

  const saveButton = screen.getByText("Save");
  expect(saveButton).toBeDisabled();

  await selectAllDimensions();

  expect(saveButton).toBeEnabled();
  fireEvent.click(saveButton);

  expect(setActiveAvailability).toHaveBeenCalledWith({
    dimensions: {
      "customer-types": "premium",
      "device-types": "pc",
    },
    timeTravel: null,
  });
});

test("selects dimensions, time travel and saves", async () => {
  const setActiveAvailability = jest.fn();

  render(
    <AvailabilityPicker
      activeValues={{ dimensions: null, timeTravel: null }}
      setActiveAvailability={setActiveAvailability}
    />,
  );

  fireEvent.click(screen.getByTestId("open-availability-picker"));

  await waitFor(() => {
    expect(screen.getByText("Device type")).toBeInTheDocument();
    expect(screen.getByText("Customer type")).toBeInTheDocument();
  });

  const saveButton = screen.getByText("Save");
  expect(saveButton).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Time travel"), {
    target: { value: "2023-11-11T12:30" },
  });

  // Save button still disabled as no dimensions selected
  expect(saveButton).toBeDisabled();

  await selectAllDimensions();

  expect(saveButton).toBeEnabled();
  fireEvent.click(saveButton);

  expect(setActiveAvailability).toHaveBeenCalledWith({
    dimensions: {
      "customer-types": "premium",
      "device-types": "pc",
    },
    timeTravel: { datetime: "2023-11-11T12:30", timezone: UTC_NAME },
  });
});

test("clears existing values", async () => {
  const setActiveAvailability = jest.fn();

  render(
    <AvailabilityPicker
      activeValues={{
        dimensions: { "customer-types": "premium", "device-types": "pc" },
        timeTravel: null,
      }}
      setActiveAvailability={setActiveAvailability}
    />,
  );

  fireEvent.click(screen.getByTestId("open-availability-picker"));

  await waitFor(() => {
    expect(screen.getByText("Device type")).toBeInTheDocument();
    expect(screen.getByText("Customer type")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Clear"));

  expect(setActiveAvailability).toHaveBeenCalledWith({
    dimensions: null,
    timeTravel: null,
  });
});

test("clears existing values using the select clear", async () => {
  const setActiveAvailability = jest.fn();

  render(
    <AvailabilityPicker
      activeValues={{
        dimensions: { "customer-types": "premium", "device-types": "pc" },
        timeTravel: null,
      }}
      setActiveAvailability={setActiveAvailability}
    />,
  );

  fireEvent.click(screen.getByLabelText("clear availability"));

  expect(setActiveAvailability).toHaveBeenCalledWith({
    dimensions: null,
    timeTravel: null,
  });
});

test("shows Dimensions & Time when both dimensions and time travel are set", () => {
  render(
    <AvailabilityPicker
      activeValues={{
        dimensions: {
          "customer-types": "premium",
          "device-types": "pc",
        },
        timeTravel: { datetime: "2023-11-11T12:30", timezone: UTC_NAME },
      }}
      setActiveAvailability={jest.fn()}
    />,
  );

  expect(screen.getByText("Dimensions & Time")).toBeInTheDocument();
});

test("does not show Dimensions when account has none", async () => {
  server.use(
    graphql.query(
      wrapQueryName("LIST_AVAILABILITY_DIMENSIONS"),
      (req, res, ctx) => {
        const data: GQLSkylarkListAvailabilityDimensionsResponse = {
          listDimensions: {
            next_token: "",
            objects: [],
          },
        };
        return res(ctx.data(data));
      },
    ),
  );

  render(
    <AvailabilityPicker
      activeValues={{
        dimensions: null,
        timeTravel: { datetime: "2023-11-11T12:30", timezone: UTC_NAME },
      }}
      setActiveAvailability={jest.fn()}
    />,
  );

  expect(screen.getByText("Time travel only")).toBeInTheDocument();

  fireEvent.click(screen.getByTestId("open-availability-picker"));

  await waitFor(() => {
    expect(screen.queryByText("Dimensions")).not.toBeInTheDocument();
    expect(screen.queryByText("Device type")).not.toBeInTheDocument();
    expect(screen.queryByText("Customer type")).not.toBeInTheDocument();
  });
});

test("selects time travel when no Dimensions exist", () => {
  const setActiveAvailability = jest.fn();

  server.use(
    graphql.query(
      wrapQueryName("LIST_AVAILABILITY_DIMENSIONS"),
      (req, res, ctx) => {
        const data: GQLSkylarkListAvailabilityDimensionsResponse = {
          listDimensions: {
            next_token: "",
            objects: [],
          },
        };
        return res(ctx.data(data));
      },
    ),
  );

  render(
    <AvailabilityPicker
      activeValues={{
        dimensions: null,
        timeTravel: null,
      }}
      setActiveAvailability={setActiveAvailability}
    />,
  );

  fireEvent.click(screen.getByTestId("open-availability-picker"));

  const saveButton = screen.getByText("Save");
  expect(saveButton).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Time travel*"), {
    target: { value: "2023-11-11T12:30" },
  });
  expect(saveButton).toBeEnabled();
  fireEvent.click(saveButton);
  expect(setActiveAvailability).toHaveBeenCalledWith({
    dimensions: null,
    timeTravel: { datetime: "2023-11-11T12:30", timezone: UTC_NAME },
  });
});
