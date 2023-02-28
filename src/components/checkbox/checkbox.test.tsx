import { fireEvent } from "@storybook/testing-library";
import { render, screen } from "@testing-library/react";

import { Checkbox } from "./checkbox.component";

const label = "Checkbox";

test("renders an unchecked checkbox", async () => {
  render(<Checkbox label={label} />);

  await screen.findByLabelText(label);

  expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
});

test("calls onCheckedChange when checked", async () => {
  const onChange = jest.fn();

  render(<Checkbox label={label} onCheckedChange={onChange} />);

  await screen.findByLabelText(label);
  await fireEvent.click(screen.getByLabelText(label));

  expect(onChange).toHaveBeenCalledWith(true);
  expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
});
