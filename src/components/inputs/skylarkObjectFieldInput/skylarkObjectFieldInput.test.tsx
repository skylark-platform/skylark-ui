import { useForm } from "react-hook-form";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";
import {
  NormalizedObjectField,
  NormalizedObjectFieldType,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

import { SkylarkObjectFieldInput } from "./skylarkObjectFieldInput.component";

const WrappedSkylarkObjectFieldInput = ({
  config,
  value,
}: {
  config: NormalizedObjectField;
  value?: SkylarkObjectMetadataField;
}) => {
  const defaultValues: Record<string, SkylarkObjectMetadataField> | undefined =
    value
      ? {
          [config.name]: value,
        }
      : undefined;

  const { register, control, getValues, formState, trigger } = useForm({
    mode: "onSubmit",
    defaultValues,
    reValidateMode: "onSubmit",
  });

  return (
    <div>
      <SkylarkObjectFieldInput
        idPrefix="test"
        register={register}
        control={control}
        value={getValues(config.name)}
        formState={formState}
        field={config.name}
        config={config}
      />
      <button type="button" onClick={() => trigger()}>
        submit
      </button>
    </div>
  );
};

const testFieldConfigs: Record<
  NormalizedObjectFieldType,
  {
    field: Omit<NormalizedObjectField, "type">;
    value: SkylarkObjectMetadataField;
    invalidValues: SkylarkObjectMetadataField[];
  }
> = {
  boolean: {
    field: {
      name: "booleanfield",
      originalType: "Boolean",
      isRequired: false,
      isList: false,
    },
    value: true,
    invalidValues: [],
  },
  string: {
    field: {
      name: "stringfield",
      originalType: "String",
      isRequired: false,
      isList: false,
    },
    value: "string",
    invalidValues: [],
  },
  int: {
    field: {
      name: "intfield",
      originalType: "Int",
      isRequired: false,
      isList: false,
    },
    value: 10,
    invalidValues: ["sdf", 0.8],
  },
  float: {
    field: {
      name: "floatfield",
      originalType: "Float",
      isRequired: false,
      isList: false,
    },
    value: 0.1,
    invalidValues: ["string"],
  },
  date: {
    field: {
      name: "datefield",
      originalType: "AWSDate",
      isRequired: false,
      isList: false,
    },
    value: "2000-03-20",
    invalidValues: ["20:11:12"],
  },
  time: {
    field: {
      name: "timefield",
      originalType: "AWSTime",
      isRequired: false,
      isList: false,
    },
    value: "12:30",
    invalidValues: ["string"],
  },
  timestamp: {
    field: {
      name: "timestampfield",
      originalType: "AWSTimestamp",
      isRequired: false,
      isList: false,
    },
    value: "1233453453",
    invalidValues: ["string"],
  },
  datetime: {
    field: {
      name: "datetimefield",
      originalType: "AWSDateTime",
      isRequired: false,
      isList: false,
    },
    value: "2000-03-20T12:30:00.000",
    invalidValues: ["string"],
  },
  email: {
    field: {
      name: "emailfield",
      originalType: "AWSEmail",
      isRequired: false,
      isList: false,
    },
    value: "example@example.com",
    invalidValues: ["notanemail.com"],
  },
  phone: {
    field: {
      name: "phonefield",
      originalType: "AWSPhone",
      isRequired: false,
      isList: false,
    },
    value: "+447888888888",
    invalidValues: [],
  },
  url: {
    field: {
      name: "urlfield",
      originalType: "AWSURL",
      isRequired: false,
      isList: false,
    },
    value: "https://example.com",
    invalidValues: ["example.com"],
  },
  ipaddress: {
    field: {
      name: "ipaddressfield",
      originalType: "AWSIPAddress",
      isRequired: false,
      isList: false,
    },
    value: "192.0.0.1",
    invalidValues: ["123123123.123.123.12123"],
  },
  json: {
    field: {
      name: "jsonfield",
      originalType: "AWSJSON",
      isRequired: false,
      isList: false,
    },
    value: "{}",
    invalidValues: [],
  },
  enum: {
    field: {
      name: "enumfield",
      originalType: "String",
      enumValues: ["value1", "value2"],
      isRequired: false,
      isList: false,
    },
    value: "value1",
    invalidValues: [],
  },
};

describe("renders inputs", () => {
  Object.entries(testFieldConfigs).forEach(
    ([type, { field, value, invalidValues }]) => {
      describe(`${type}`, () => {
        const config: NormalizedObjectField = {
          ...field,
          type: type as NormalizedObjectFieldType,
        };

        if (type !== "enum") {
          test(`renders an input when the config type is a ${type}`, async () => {
            render(<WrappedSkylarkObjectFieldInput config={config} />);

            // Get input using the label
            const input = screen.getByLabelText(formatObjectField(config.name));
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute("aria-invalid", "false");
          });

          test(`renders an asterisk in the label when the type ${type} input is required`, async () => {
            render(
              <WrappedSkylarkObjectFieldInput
                config={{
                  ...config,
                  isRequired: true,
                  originalType: config.originalType,
                }}
              />,
            );

            // Get input using the label
            const label = screen.getByText("*");
            expect(label).toBeInTheDocument();
            expect(label).toHaveClass("text-error");
          });

          test(`renders an input when the config type is a ${type} with an existing value`, async () => {
            render(
              <WrappedSkylarkObjectFieldInput config={config} value={value} />,
            );

            expect(await screen.findByText("submit")).toBeInTheDocument();

            // Get input using the label
            const input = screen.getByLabelText(formatObjectField(config.name));
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute("aria-invalid", "false");
          });

          invalidValues.forEach((invalidValue) => {
            test(`causes an error for config type ${type} with the value "${invalidValue}"`, async () => {
              render(
                <WrappedSkylarkObjectFieldInput
                  config={config}
                  value={invalidValue}
                />,
              );

              // Get input using the label
              const input = screen.getByLabelText(
                formatObjectField(config.name),
              );
              expect(input).toBeInTheDocument();
              expect(input).toHaveAttribute("aria-invalid", "false");

              await fireEvent.click(screen.getByText("submit"));

              await waitFor(() =>
                expect(input).toHaveAttribute("aria-invalid", "true"),
              );
            });
          });
        } else {
          test("renders a select for an enum", async () => {
            render(<WrappedSkylarkObjectFieldInput config={config} />);

            const input = screen.getByPlaceholderText(
              `Select ${formatObjectField("enumfield")}`,
            );
            expect(input).toBeInTheDocument();
          });
        }
      });
    },
  );

  test("renders an enum type when it doesn't have any enumValues", () => {
    const { field } = testFieldConfigs.enum;
    render(
      <WrappedSkylarkObjectFieldInput
        config={{
          ...field,
          type: "enum",
          enumValues: undefined,
        }}
      />,
    );

    const input = screen.getByPlaceholderText(
      `Select ${formatObjectField("enumfield")}`,
    );
    expect(input).toBeInTheDocument();
  });
});

test("copies the value to the clipboard", async () => {
  const config: NormalizedObjectField = {
    name: "stringfield",
    originalType: "String",
    isRequired: false,
    isList: false,
    type: "string",
  };
  const value = "example";

  jest.spyOn(navigator.clipboard, "writeText");

  render(<WrappedSkylarkObjectFieldInput config={config} value={value} />);

  const copyToken = screen.getByLabelText("Copy example to clipboard");
  fireEvent.click(copyToken);

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(value);
});
