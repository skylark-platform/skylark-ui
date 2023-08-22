import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";

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

  expect(screen.getByText("Dimensions")).toBeInTheDocument();
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
    timeTravel: { datetime: "2023-11-11T12:30", offset: "+00:00" },
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
