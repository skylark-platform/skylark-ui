import { render, screen, fireEvent } from "src/__tests__/utils/test-utils";

import { Select, SelectOption } from "./select.component";

const options = ["Episode", "Season", "Brand"].map((val) => ({
  label: val,
  value: val,
}));

test("renders an unselected Select", async () => {
  render(
    <Select
      variant="primary"
      options={options}
      selected=""
      placeholder="Object Type"
      searchable={false}
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("Object Type");
});

test("renders a Select with label", async () => {
  render(
    <Select
      variant="primary"
      options={options}
      selected=""
      placeholder="Object Type"
      label="This is the label"
      searchable={false}
    />,
  );

  expect(screen.getByText("This is the label")).toBeInTheDocument();
});

test("renders a selected Select", async () => {
  render(
    <Select
      variant="primary"
      options={options}
      selected="Episode"
      placeholder="Object Type"
      searchable={false}
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("Episode");
});

test("renders with numbers used as values and a selected Select", async () => {
  render(
    <Select
      variant="primary"
      options={[1, 2, 3].map((n) => ({ label: `${n}`, value: n }))}
      selected={1}
      placeholder="Number"
      searchable={false}
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("1");
});

test("calls onChange when a new item is selected", async () => {
  const onChange = jest.fn();

  render(
    <Select
      variant="primary"
      options={options}
      selected=""
      placeholder="Object Type"
      onChange={onChange}
      searchable={false}
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("Object Type");
  await fireEvent.mouseDown(screen.getByRole("button"));

  const gotOptions = await screen.findAllByRole("option");
  gotOptions.forEach((_, i) => {
    expect(gotOptions[i]).toHaveTextContent(options[i].label);
  });

  await fireEvent.mouseDown(screen.getByText("Season"));

  expect(onChange).toHaveBeenCalledWith("Season");
});

test("searches for Episode", async () => {
  const onChange = jest.fn();

  render(
    <Select
      variant="primary"
      options={options}
      selected=""
      placeholder="Object Type"
      onChange={onChange}
      searchable
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("");
  await fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "Epis" },
  });

  const gotOptions = await screen.findAllByRole("option");
  expect(gotOptions.length).toBe(1);
  expect(gotOptions[0]).toHaveTextContent("Episode");

  await fireEvent.mouseDown(screen.getByText("Episode"));

  expect(onChange).toHaveBeenCalledWith("Episode");
});

test("shows not found when not found", async () => {
  const onChange = jest.fn();

  render(
    <Select
      variant="primary"
      options={options}
      selected=""
      placeholder="Object Type"
      onChange={onChange}
      searchable
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("");
  await fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "Custom Value" },
  });

  await screen.findAllByText("Nothing found.");
  expect(screen.getByText("Nothing found.")).toBeInTheDocument();
});

test("adds a custom value when allowCustomValue is true and the option is not found", async () => {
  const onChange = jest.fn();

  render(
    <Select
      variant="primary"
      options={options}
      selected=""
      placeholder="Object Type"
      onChange={onChange}
      searchable
      allowCustomValue
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("");
  await fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "Custom Value" },
  });

  const gotOptions = await screen.findAllByRole("option");
  expect(gotOptions.length).toBe(1);
  expect(gotOptions[0]).toHaveTextContent('Use "Custom Value"');

  await fireEvent.mouseDown(screen.getByText('Use "Custom Value"'));

  expect(onChange).toHaveBeenCalledWith("Custom Value");
});

test("clears the value", () => {
  const onValueClear = jest.fn();

  render(
    <Select
      variant="primary"
      options={options}
      selected={options[0].label}
      placeholder="Object Type"
      searchable
      allowCustomValue
      onValueClear={onValueClear}
    />,
  );

  fireEvent.click(screen.getByTestId("select-clear-value"));

  expect(onValueClear).toHaveBeenCalled();
});

test("renders options with tooltips", async () => {
  const tooltipOptions: SelectOption<string>[] = [
    "Episode",
    "Season",
    "Brand",
  ].map((val) => ({
    label: val,
    value: val,
    infoTooltip: `Tooltip for ${val}`,
  }));

  render(
    <Select
      variant="primary"
      options={tooltipOptions}
      selected={tooltipOptions[0].label}
      placeholder="Object Type"
    />,
  );

  const tooltipTrigger = screen.getByTestId("select-tooltip-trigger");
  expect(tooltipTrigger).toBeInTheDocument();

  await fireEvent.mouseDown(screen.getByRole("button"));

  const gotOptions = await screen.findAllByRole("option");

  const allToolTipTriggers = screen.getAllByTestId("select-tooltip-trigger");

  expect(allToolTipTriggers.length).toEqual(gotOptions.length + 1);
});
