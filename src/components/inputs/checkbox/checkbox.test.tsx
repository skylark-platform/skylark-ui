import { render, screen, fireEvent } from "src/__tests__/utils/test-utils";

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

test("calls onOnlyClick when 'Only' is checked", async () => {
  const onOnlyClick = jest.fn();

  render(<Checkbox label={label} onOnlyClick={onOnlyClick} />);

  await fireEvent.click(screen.getByText("Only"));

  expect(onOnlyClick).toHaveBeenCalled();
});

test("doesn't call onCheckedChange when disabled", async () => {
  const onChange = jest.fn();

  render(<Checkbox label={label} onCheckedChange={onChange} disabled />);

  await screen.findByLabelText(label);
  await fireEvent.click(screen.getByLabelText(label));

  expect(onChange).not.toHaveBeenCalled();
});
