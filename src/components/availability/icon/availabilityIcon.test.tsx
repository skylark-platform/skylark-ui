import { render, screen } from "src/__tests__/utils/test-utils";
import { AvailabilityStatus } from "src/interfaces/skylark";

import { AvailabilityIcon } from "./availabilityIcon.component";

test("shows unavailable icon when status is null", () => {
  render(<AvailabilityIcon status={null} />);

  expect(
    screen.getByLabelText("No Availabilities assigned."),
  ).toBeInTheDocument();
});

test("shows unavailable icon when status is Unavailable", () => {
  render(<AvailabilityIcon status={AvailabilityStatus.Unavailable} />);

  expect(
    screen.getByLabelText("No Availabilities assigned."),
  ).toBeInTheDocument();
});

test("shows active icon when status is Active", () => {
  render(<AvailabilityIcon status={AvailabilityStatus.Active} />);

  expect(
    screen.getByLabelText(
      "This object has at least one active Availability assigned.",
    ),
  ).toBeInTheDocument();
});

test("shows future icon when status is Future", () => {
  render(<AvailabilityIcon status={AvailabilityStatus.Future} />);

  expect(
    screen.getByLabelText(
      "No active Availability assigned, at least one will be active in the future.",
    ),
  ).toBeInTheDocument();
});

test("shows expired icon when status is Expired", () => {
  render(<AvailabilityIcon status={AvailabilityStatus.Expired} />);

  expect(
    screen.getByLabelText(
      "All Availabilities assigned to this object are expired.",
    ),
  ).toBeInTheDocument();
});
