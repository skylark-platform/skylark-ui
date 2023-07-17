import { useState } from "react";

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "src/__tests__/utils/test-utils";

import {
  CheckboxGrid as CheckboxGridComponent,
  CheckboxGridProps,
  CheckboxOption,
  createCheckboxOptions,
} from "./checkboxGrid.component";

const CheckboxGrid = (props: Omit<CheckboxGridProps, "checkedOptions">) => {
  const [checkedOptions, setCheckedObjects] = useState<string[]>([]);

  const onChangeWrapper = (checked: string[]) => {
    setCheckedObjects(checked);
    props.onChange(checked);
  };

  return (
    <CheckboxGridComponent
      {...props}
      checkedOptions={checkedOptions}
      onChange={onChangeWrapper}
    />
  );
};

describe("createCheckboxOptions", () => {
  const strOpts = ["opt1", "opt2"];
  const options: CheckboxOption[] = strOpts.map((opt) => ({
    label: opt,
    value: opt,
  }));

  test("returns an empty object when no options are given", () => {
    const got = createCheckboxOptions([], []);
    expect(got).toEqual([]);
  });

  test("returns all options as false when activeOptions is empty", () => {
    const got = createCheckboxOptions(options, []);
    expect(got).toEqual(
      options.map((option) => ({
        option,
        state: false,
      })),
    );
  });

  test("returns activeOptions as true", () => {
    const got = createCheckboxOptions(options, ["opt2"]);
    expect(got).toEqual(
      options.map((option) => ({
        option,
        state: ["opt2"].includes(option.value),
      })),
    );
  });
});

describe("CheckboxGrid", () => {
  const label = "Check Box Grid";
  const strOpts = ["opt1", "opt2", "opt3"];
  const options: CheckboxOption[] = strOpts.map((opt) => ({
    label: opt,
    value: opt,
  }));
  const checkBoxOptions = createCheckboxOptions(options, []);

  test("renders unchecked and displays label", async () => {
    render(
      <CheckboxGrid
        label={label}
        options={checkBoxOptions}
        onChange={() => ""}
      />,
    );

    await screen.findByRole("heading");

    expect(screen.getByRole("heading")).toHaveTextContent(label);
    screen.getAllByRole("checkbox").forEach((el) => {
      expect(el).toHaveAttribute("aria-checked", "false");
    });
  });

  test("renders toggleAll when prop is given", async () => {
    render(
      <CheckboxGrid
        label={label}
        withToggleAll
        options={checkBoxOptions}
        onChange={() => ""}
      />,
    );

    await screen.findByRole("heading");

    expect(screen.getAllByRole("checkbox")[0]).toHaveAttribute(
      "id",
      "checkbox-toggle-all-check-box-grid",
    );
  });

  test("calls onChange when a checkbox is checked", async () => {
    const onChange = jest.fn();
    render(
      <CheckboxGrid
        label={label}
        options={checkBoxOptions}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    expect(onChange).toHaveBeenCalledWith(["opt1"]);
    screen.getAllByRole("checkbox").forEach((el, i) => {
      expect(el).toHaveAttribute("aria-checked", i === 0 ? "true" : "false");
    });
  });

  test("calls onChange with all options as true when toggle all is clicked and no options are checked", async () => {
    const onChange = jest.fn();
    render(
      <CheckboxGrid
        label={label}
        withToggleAll
        options={checkBoxOptions}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    expect(onChange).toHaveBeenCalledWith(["opt1", "opt2", "opt3"]);
    screen.getAllByRole("checkbox").forEach((el) => {
      expect(el).toHaveAttribute("aria-checked", "true");
    });
  });

  test("calls onChange with all options as true when toggle all is clicked and some options are checked", async () => {
    const onChange = jest.fn();
    render(
      <CheckboxGrid
        label={label}
        withToggleAll
        options={createCheckboxOptions(options, ["opt1", "opt2"])}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    expect(onChange).toHaveBeenCalledWith(["opt1", "opt2", "opt3"]);
    screen.getAllByRole("checkbox").forEach((el) => {
      expect(el).toHaveAttribute("aria-checked", "true");
    });
  });

  test("calls onChange with all options as false when toggle all is clicked and all options are checked", async () => {
    const onChange = jest.fn();
    render(
      <CheckboxGrid
        label={label}
        withToggleAll
        options={createCheckboxOptions(options, strOpts)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    expect(onChange).toHaveBeenCalledWith(["opt1", "opt2", "opt3"]);
    screen.getAllByRole("checkbox").forEach((el) => {
      expect(el).toHaveAttribute("aria-checked", "true");
    });
  });

  test("calls onChange with only the clicked option when 'Only' is clicked", async () => {
    const onChange = jest.fn();
    render(
      <CheckboxGrid
        label={label}
        options={createCheckboxOptions(options, strOpts)}
        onChange={onChange}
      />,
    );

    const withinCheckboxContainer = within(
      screen.getAllByRole("checkbox")[1].parentElement as HTMLDivElement,
    );

    fireEvent.click(withinCheckboxContainer.getByText("Only"));

    expect(onChange).toHaveBeenCalledWith(["opt2"]);
    screen.getAllByRole("checkbox").forEach((el, i) => {
      expect(el).toHaveAttribute("aria-checked", i === 1 ? "true" : "false");
    });
  });
});
