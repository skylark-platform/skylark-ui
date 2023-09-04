import { render, screen } from "src/__tests__/utils/test-utils";
import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";
import { formatReadableDateTime } from "src/lib/skylark/availability";

import { Cell, CellProps } from "./cell.component";

const defaultProps: CellProps = {
  field: {
    name: "Input",
    type: "string",
    originalType: "String",
    isList: false,
    isRequired: false,
  },
  objectType: "Episode",
  value: "example value",
  columnId: "uid",
};

test("returns just the value when no custom field config exists", () => {
  render(<Cell {...defaultProps} />);

  expect(screen.getByText(defaultProps.value)).toBeInTheDocument();
});

test("returns pretty printed date for date field", () => {
  render(
    <Cell
      {...defaultProps}
      field={{ ...defaultProps.field, type: "date" }}
      value="2022-12-30"
    />,
  );

  expect(
    screen.getByText(formatReadableDateTime("2022-12-30")),
  ).toBeInTheDocument();
});

test("returns pretty printed date for datetime field", () => {
  render(
    <Cell
      {...defaultProps}
      field={{ ...defaultProps.field, type: "datetime" }}
      value="2022-12-30T13:30:00"
    />,
  );

  expect(
    screen.getByText(formatReadableDateTime("2022-12-30T13:30:00")),
  ).toBeInTheDocument();
});

test("returns pretty printed date for timestamp field", () => {
  render(
    <Cell
      {...defaultProps}
      field={{ ...defaultProps.field, type: "timestamp" }}
      value="1692753495"
    />,
  );

  expect(
    screen.getByText(formatReadableDateTime("1692753495")),
  ).toBeInTheDocument();
});

test("returns a span with class text-right when type is a int", () => {
  render(
    <Cell
      {...defaultProps}
      field={{ ...defaultProps.field, type: "int" }}
      value="3"
    />,
  );

  const value = screen.getByText("3");
  expect(value).toBeInTheDocument();
  expect(value.tagName).toBe("SPAN");
  expect(value.classList).toContain("text-right");
});

test("returns a span with class text-right when type is a float", () => {
  render(
    <Cell
      {...defaultProps}
      field={{ ...defaultProps.field, type: "float" }}
      value="3.5"
    />,
  );

  const value = screen.getByText("3.5");
  expect(value).toBeInTheDocument();
  expect(value.tagName).toBe("SPAN");
  expect(value.classList).toContain("text-right");
});

test("returns the value with text-error class when the enumValue does not exist", () => {
  render(
    <Cell
      {...defaultProps}
      field={{
        ...defaultProps.field,
        type: "enum",
        enumValues: ["value1", "value2"],
      }}
      value="value3"
    />,
  );

  const value = screen.getByText("value3");
  expect(value).toBeInTheDocument();
  expect(value.tagName).toBe("SPAN");
  expect(value.classList).toContain("text-error");
});

test("returns the value only when the enum does exist", () => {
  render(
    <Cell
      {...defaultProps}
      field={{
        ...defaultProps.field,
        type: "enum",
        enumValues: ["value1", "value2"],
      }}
      value="value2"
    />,
  );

  const value = screen.getByText("value2");
  expect(value).toBeInTheDocument();
  expect(value.tagName).not.toBe("SPAN");
  expect(value.classList).not.toContain("text-error");
});

test("returns an anchor tag when the field type is url", () => {
  render(
    <Cell
      {...defaultProps}
      field={{
        ...defaultProps.field,
        type: "url",
      }}
      value="https://skylark.com"
    />,
  );

  const value = screen.getByText("https://skylark.com");
  expect(value).toBeInTheDocument();
  expect(value.tagName).toBe("A");
});

test("returns an anchor tag when the field type is string but the objectType is SkylarkImage and the columnId is external_url", () => {
  render(
    <Cell
      {...defaultProps}
      value="https://skylark.com"
      objectType={BuiltInSkylarkObjectType.SkylarkImage}
      columnId="external_url"
    />,
  );

  const value = screen.getByText("https://skylark.com");
  expect(value).toBeInTheDocument();
  expect(value.tagName).toBe("A");
});
