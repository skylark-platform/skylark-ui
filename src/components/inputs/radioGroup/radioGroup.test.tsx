import { fireEvent } from "@storybook/testing-library";

import { render, screen } from "src/__tests__/utils/test-utils";

import { RadioGroup } from "./radioGroup.component";

const label = "Checkbox";

const options = ["Episode", "Season", "Brand"].map((val) => ({
  label: val,
  value: val,
}));

test("renders a radio group with the first item checked", async () => {
  const onChange = jest.fn();

  render(
    <RadioGroup
      label={label}
      options={options}
      onChange={onChange}
      selected={options[0]}
    />,
  );

  await screen.findByLabelText(options[0].label);

  const radios = screen.getAllByRole("radio");

  expect(radios).toHaveLength(options.length);
  expect(radios[0]).toHaveAttribute("aria-checked", "true");
  expect(radios[1]).toHaveAttribute("aria-checked", "false");
  expect(radios[2]).toHaveAttribute("aria-checked", "false");
});

test("changes the checked radio", async () => {
  const onChange = jest.fn();

  render(
    <RadioGroup
      label={label}
      options={options}
      onChange={onChange}
      selected={options[0]}
    />,
  );

  await screen.findByLabelText(options[0].label);

  fireEvent.click(screen.getByLabelText(options[1].label));

  expect(onChange).toHaveBeenCalledWith(options[1]);
});
