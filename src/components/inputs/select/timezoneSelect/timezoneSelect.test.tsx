import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "src/__tests__/utils/test-utils";

import { TimezoneSelect } from "./timezoneSelect.component";

test('searches for the "Europe/London" timezone', async () => {
  const onChange = jest.fn();

  render(
    <TimezoneSelect
      variant="primary"
      selected=""
      onChange={onChange}
      placeholder=""
    />,
  );

  const combobox = screen.getByRole("combobox");

  await waitFor(() => {
    expect(combobox).not.toBeDisabled();
  });

  expect(combobox).toHaveTextContent("");
  fireEvent.change(combobox, {
    target: { value: "london" },
  });

  const gotOptions = await screen.findAllByRole("option");
  expect(gotOptions.length).toBe(1);
  expect(gotOptions[0]).toHaveTextContent("Europe/London");

  fireEvent.mouseDown(screen.getByText("Europe/London"));

  expect(onChange).toHaveBeenCalledWith("Europe/London");
});
