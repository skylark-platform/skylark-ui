import { render, screen } from "src/__tests__/utils/test-utils";
import { AvailabilityStatus } from "src/interfaces/skylark";

import {
  AvailabilityLabel,
  AvailabilityLabelPill,
} from "./availabilityLabel.component";

describe("AvailabilityLabel", () => {
  test("shows unavailable when status is null", () => {
    render(<AvailabilityLabel status={null} />);

    expect(
      screen.getByText(AvailabilityStatus.Unavailable),
    ).toBeInTheDocument();
  });
});

describe("AvailabilityLabelPill", () => {
  test("shows unavailable when status is null", () => {
    render(<AvailabilityLabelPill status={null} />);

    expect(
      screen.getByText(AvailabilityStatus.Unavailable),
    ).toBeInTheDocument();
  });
});
