import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "src/__tests__/utils/test-utils";

import { ObjectTypeSelect } from "./objectTypeSelect.component";

test("searches for Episode", async () => {
  const onChange = jest.fn();

  render(
    <ObjectTypeSelect
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
    target: { value: "Epis" },
  });

  const gotOptions = await screen.findAllByRole("option");
  expect(gotOptions.length).toBe(1);
  expect(gotOptions[0]).toHaveTextContent("Episode");

  fireEvent.mouseDown(screen.getByText("Episode"));

  expect(onChange).toHaveBeenCalledWith({
    objectType: "Episode",
    config: expect.any(Object),
  });
});
