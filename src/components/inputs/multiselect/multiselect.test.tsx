import {
  render,
  screen,
  fireEvent,
  within,
  prettyDOM,
} from "src/__tests__/utils/test-utils";
import { SelectOption } from "src/components/inputs/select";

import { MultiSelect } from "./multiselect.component";

const options: SelectOption<string>[] = [
  {
    label: "opt1",
    value: "opt1",
  },
  {
    label: "opt2",
    value: "opt2",
  },
  {
    label: "opt3",
    value: "opt3",
  },
];

test("displays all selected options as pills", () => {
  render(<MultiSelect options={options} selected={["opt1", "opt3"]} />);

  expect(screen.queryAllByText("opt1")).toHaveLength(1);
  expect(screen.queryAllByText("opt2")).toHaveLength(0);
  expect(screen.queryAllByText("opt3")).toHaveLength(1);
});

test("selects an option", () => {
  const onChange = jest.fn();

  render(<MultiSelect options={options} onChange={onChange} />);

  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.mouseDown(within(screen.getByRole("listbox")).getByText("opt2"));

  expect(onChange).toHaveBeenCalledWith(["opt2"]);
});

test("selects an option - virtualised", () => {
  const onChange = jest.fn();

  render(
    <MultiSelect
      options={Array.from({ length: 50 }, (_, i) => ({
        label: `label-${i}`,
        value: `value-${i}`,
      }))}
      onChange={onChange}
    />,
  );

  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.mouseDown(within(screen.getByRole("listbox")).getByText("label-1"));

  expect(onChange).toHaveBeenCalledWith(["value-1"]);
});

test("deselects an option", () => {
  const onChange = jest.fn();

  render(
    <MultiSelect
      options={options}
      onChange={onChange}
      selected={options.map(({ value }) => value)}
    />,
  );

  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.mouseDown(within(screen.getByRole("listbox")).getByText("opt2"));

  expect(onChange).toHaveBeenCalledWith(["opt1", "opt3"]);
});

test("deselects an option using the x in the pill", () => {
  const onChange = jest.fn();

  render(
    <MultiSelect
      options={options}
      onChange={onChange}
      selected={options.map(({ value }) => value)}
    />,
  );

  fireEvent.mouseDown(screen.getByRole("combobox"));

  const selectedPill = within(
    screen.getByTestId("multiselect-input").parentElement as HTMLDivElement,
  ).getByText("opt2").parentElement as HTMLDivElement;

  fireEvent.click(within(selectedPill).getByRole("button", { hidden: true }));

  expect(onChange).toHaveBeenCalledWith(["opt1", "opt3"]);
});
