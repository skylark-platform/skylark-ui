import { fireEvent, waitFor } from "@storybook/testing-library";

import { render, screen } from "src/__tests__/utils/test-utils";

import { TimezoneSelect } from "./timezoneSelect.component";

test('searches for the "+03:00" offset', async () => {
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
    target: { value: "03:00" },
  });

  const gotOptions = screen.queryAllByRole("option");
  expect(gotOptions.length).toBe(2);
  expect(gotOptions[1]).toHaveTextContent("+03:00");

  fireEvent.click(screen.getByText("+03:00"));

  expect(onChange).toHaveBeenCalledWith("+03:00");
});
