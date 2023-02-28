import { fireEvent, render, screen } from "@testing-library/react";

import { CheckboxGrid, createCheckboxOptions } from "./checkboxGrid.component";

describe("createCheckboxOptions", () => {
  test("returns an empty object when no options are given", () => {
    const got = createCheckboxOptions([], []);
    expect(got).toEqual({});
  });

  test("returns all options as false when activeOptions is empty", () => {
    const got = createCheckboxOptions(["opt1", "opt2"], []);
    expect(got).toEqual({
      opt1: false,
      opt2: false,
    });
  });

  test("returns activeOptions as true", () => {
    const got = createCheckboxOptions(["opt1", "opt2"], ["opt2"]);
    expect(got).toEqual({
      opt1: false,
      opt2: true,
    });
  });
});

describe("CheckboxGrid", () => {
  const label = "Check Box Grid";
  const options = ["opt1", "opt2", "opt3"];
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

  test("calls onChange with all options when toggle all is clicked and no options are checked", async () => {
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

    expect(onChange).toHaveBeenCalledWith(options);
    screen.getAllByRole("checkbox").forEach((el) => {
      expect(el).toHaveAttribute("aria-checked", "true");
    });
  });

  test("calls onChange with all options when toggle all is clicked and some options are checked", async () => {
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

    expect(onChange).toHaveBeenCalledWith(options);
    screen.getAllByRole("checkbox").forEach((el) => {
      expect(el).toHaveAttribute("aria-checked", "true");
    });
  });

  test("calls onChange with an empty array when toggle all is clicked and all options are checked", async () => {
    const onChange = jest.fn();
    render(
      <CheckboxGrid
        label={label}
        withToggleAll
        options={createCheckboxOptions(options, options)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    expect(onChange).toHaveBeenCalledWith([]);
    screen.getAllByRole("checkbox").forEach((el) => {
      expect(el).toHaveAttribute("aria-checked", "false");
    });
  });
});
