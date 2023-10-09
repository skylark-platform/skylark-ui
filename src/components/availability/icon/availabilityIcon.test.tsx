import { render, screen } from "src/__tests__/utils/test-utils";
import { AvailabilityStatus } from "src/interfaces/skylark";

import { AvailabilityIcon } from "./availabilityIcon.component";

test("shows unavailable icon when status is null", () => {
  render(<AvailabilityIcon status={null} />);

  expect(
    screen.getByLabelText("Object's Availability is Unavailable"),
  ).toBeInTheDocument();
});

test("shows future icon when status is Future", () => {
  render(<AvailabilityIcon status={AvailabilityStatus.Future} />);

  expect(
    screen.getByLabelText("Object's Availability is Future"),
  ).toBeInTheDocument();
});
