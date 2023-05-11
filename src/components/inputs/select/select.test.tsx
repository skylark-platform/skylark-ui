import { fireEvent } from "@storybook/testing-library";

import { render, screen } from "src/__tests__/utils/test-utils";

import { Select } from "./select.component";

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
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("Episode");
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
    />,
  );

  expect(screen.getByRole("button")).toHaveTextContent("Object Type");
  await fireEvent.click(screen.getByRole("button"));

  const gotOptions = screen.queryAllByRole("option");
  gotOptions.forEach((_, i) => {
    expect(gotOptions[i]).toHaveTextContent(options[i].label);
  });

  await fireEvent.click(screen.getByText("Season"));

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

  const gotOptions = screen.queryAllByRole("option");
  expect(gotOptions.length).toBe(1);
  expect(gotOptions[0]).toHaveTextContent("Episode");

  await fireEvent.click(screen.getByText("Episode"));

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

  const gotOptions = screen.queryAllByRole("option");
  expect(gotOptions.length).toBe(0);
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

  const gotOptions = screen.queryAllByRole("option");
  expect(gotOptions.length).toBe(1);
  expect(gotOptions[0]).toHaveTextContent('Use "Custom Value"');

  await fireEvent.click(screen.getByText('Use "Custom Value"'));

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
