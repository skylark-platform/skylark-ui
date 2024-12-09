import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "src/__tests__/utils/test-utils";

import { EnumSelect } from "./enumSelect.component";

test("searches for Episode", async () => {
  const onChange = jest.fn();

  render(
    <EnumSelect
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
    target: { value: "Objec" },
  });

  const gotOptions = await screen.findAllByRole("option");
  expect(gotOptions.length).toBe(1);
  expect(gotOptions[0]).toHaveTextContent("ObjectTypes");

  fireEvent.click(screen.getByText("ObjectTypes"));

  expect(onChange).toHaveBeenCalledWith("ObjectTypes");
});
