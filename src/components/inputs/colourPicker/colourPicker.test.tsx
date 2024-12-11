import { render, screen, fireEvent } from "src/__tests__/utils/test-utils";

import { ColourPicker } from "./colourPicker.component";

test("renders the colour picker", async () => {
  render(<ColourPicker colour="" onChange={jest.fn()} />);

  expect(screen.queryByPlaceholderText("#")).not.toBeInTheDocument();

  await fireEvent.click(screen.getByRole("button"));

  expect(await screen.findByPlaceholderText("#")).toBeInTheDocument();
});

test("calls onChange when a colour is entered", async () => {
  const onChange = jest.fn();

  render(<ColourPicker colour="" onChange={onChange} />);

  await fireEvent.click(screen.getByRole("button"));
  const input = await screen.findByPlaceholderText("#");

  fireEvent.change(input, { target: { value: "#000000" } });

  expect(onChange).toHaveBeenCalledWith("#000000");
});
