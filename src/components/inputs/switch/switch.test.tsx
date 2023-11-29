import { fireEvent } from "@storybook/testing-library";

import { render, screen } from "src/__tests__/utils/test-utils";

import { Switch } from "./switch.component";

test("renders a falsy Switch", async () => {
  render(<Switch enabled={false} onChange={jest.fn()} />);

  await screen.findByRole("switch");

  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
});

test("calls onChange when checked", async () => {
  const onChange = jest.fn();

  render(<Switch enabled={true} onChange={onChange} />);

  await screen.findByRole("switch");
  await fireEvent.click(screen.getByRole("switch"));

  expect(onChange).toHaveBeenCalledWith(false);
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
});
