import { CheckedState } from "@radix-ui/react-checkbox";
import {
  UseFormRegister,
  FieldValues,
  Control,
  FormState,
  Controller,
  FieldError,
  RegisterOptions,
  ValidationRule,
} from "react-hook-form";

import { Checkbox } from "src/components/inputs/checkbox";
import { Select } from "src/components/inputs/select";
import { INPUT_REGEX, SYSTEM_FIELDS } from "src/constants/skylark";
import {
  NormalizedObjectField,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { parseInputFieldValue } from "src/lib/skylark/parsers";
import {
  formatObjectField,
  convertFieldTypeToHTMLInputType,
} from "src/lib/utils";

interface SkylarkObjectFieldInputProps {
  field: string;
  config: NormalizedObjectField;
  register: UseFormRegister<FieldValues>;
  control: Control<Record<string, SkylarkObjectMetadataField>>;
  value: SkylarkObjectMetadataField;
  formState: FormState<Record<string, SkylarkObjectMetadataField>>;
  additionalRequiredFields?: string[];
}

interface SkylarkObjectFieldInputComponentProps
  extends SkylarkObjectFieldInputProps {
  error?: FieldError;
  registerOptions?: RegisterOptions<FieldValues, string>;
}

const createHtmlForId = (field: SkylarkObjectFieldInputProps["field"]) =>
  `skylark-object-field-input-${field}`;

const SkylarkObjectFieldInputLabel = ({
  field,
  isRequired,
}: {
  field: SkylarkObjectFieldInputProps["field"];
  isRequired?: boolean;
}) => (
  <label className="mb-2 block font-bold" htmlFor={createHtmlForId(field)}>
    {formatObjectField(field)}
    {isRequired && <span className="pl-0.5 text-error">*</span>}
  </label>
);

const SkylarkObjectFieldInputEnum = ({
  field,
  control,
  config,
  error,
}: SkylarkObjectFieldInputComponentProps) => (
  <Controller
    name={field}
    control={control}
    render={({ field }) => (
      <Select
        className="w-full"
        variant="primary"
        selected={(field.value as string) || ""}
        options={
          config.enumValues?.map((opt) => ({
            value: opt,
            label: opt,
          })) || []
        }
        placeholder={`Select ${formatObjectField(field.name)}`}
        onChange={field.onChange}
        aria-invalid={error ? "true" : "false"}
      />
    )}
  />
);

const SkylarkObjectFieldInputBoolean = ({
  field,
  control,
  error,
}: SkylarkObjectFieldInputComponentProps) => (
  <Controller
    name={field}
    control={control}
    render={({ field }) => (
      <Checkbox
        checked={field.value as CheckedState}
        onCheckedChange={field.onChange}
        aria-invalid={error ? "true" : "false"}
        id={createHtmlForId(field.name)}
      />
    )}
  />
);

const SkylarkObjectFieldInputTextArea = ({
  field,
  register,
  value,
  error,
  registerOptions,
}: SkylarkObjectFieldInputComponentProps) => (
  <textarea
    {...register(field, registerOptions)}
    aria-invalid={error ? "true" : "false"}
    id={createHtmlForId(field)}
    rows={
      (value &&
        (((value as string).length > 1000 && 18) ||
          ((value as string).length > 150 && 9) ||
          ((value as string).length > 50 && 5))) ||
      1
    }
    className="w-full rounded-sm bg-manatee-50 py-3 px-4"
  />
);

const SkylarkObjectFieldInputGeneric = ({
  field,
  register,
  config,
  error,
  registerOptions,
}: SkylarkObjectFieldInputComponentProps) => (
  <input
    {...register(field, {
      ...registerOptions,
    })}
    id={createHtmlForId(field)}
    aria-invalid={error ? "true" : "false"}
    type={convertFieldTypeToHTMLInputType(config.type)}
    step={
      (config.type === "int" && "1") ||
      (config.type === "float" && "any") ||
      undefined
    }
    className="w-full rounded-sm bg-manatee-50 py-3 px-4"
  />
);

export const SkylarkObjectFieldInput = (
  props: SkylarkObjectFieldInputProps,
) => {
  const { field, config, formState, additionalRequiredFields } = props;
  const required =
    config.isRequired || additionalRequiredFields?.includes(config.name)
      ? `${formatObjectField(field)} is required`
      : false;

  const error = formState.errors[field];

  let pattern: ValidationRule<RegExp> | undefined;
  if (config.type === "url") {
    pattern = {
      value: new RegExp(INPUT_REGEX.url, "isg"),
      message: "Value does not match URL validation",
    };
  } else if (config.type === "ipaddress") {
    pattern = {
      value: new RegExp(INPUT_REGEX.ipaddress, "isg"),
      message: "Value does not match IP Address validation",
    };
  } else if (config.type === "email") {
    pattern = {
      value: new RegExp(INPUT_REGEX.email, "isg"),
      message: "Value does not match Email validation",
    };
  }

  const inputProps: SkylarkObjectFieldInputComponentProps = {
    ...props,
    error,
    registerOptions: {
      required,
      validate: (value) => {
        try {
          // If empty don't validate
          const isInvalidDate =
            ["date", "datetime", "time", "timestamp"].includes(config.type) &&
            value === "Invalid Date";
          if (value === "" || isInvalidDate) {
            return true;
          }
          if (config.type === "int" || config.type === "float") {
            const intValue = parseInt(value);
            const floatValue = parseFloat(value);
            const isNaN =
              Number.isNaN(value) ||
              Number.isNaN(intValue) ||
              Number.isNaN(floatValue);
            const isFloat = !Number.isInteger(floatValue);

            if (isNaN || (config.type === "int" && isFloat)) {
              return false;
            }
          }
          parseInputFieldValue(value, config.type);
        } catch (err) {
          return false;
        }
      },
      pattern,
    },
  };

  return (
    <div className="mb-4 text-sm">
      <SkylarkObjectFieldInputLabel field={field} isRequired={!!required} />
      {(() => {
        if (config.type === "enum") {
          return <SkylarkObjectFieldInputEnum {...inputProps} />;
        } else if (config.type === "boolean") {
          return <SkylarkObjectFieldInputBoolean {...inputProps} />;
        } else if (config.type === "string" && !SYSTEM_FIELDS.includes(field)) {
          return <SkylarkObjectFieldInputTextArea {...inputProps} />;
        } else {
          return <SkylarkObjectFieldInputGeneric {...inputProps} />;
        }
      })()}
      {error && (
        <span className="mt-1 block text-xs text-error">
          {error?.message ||
            (error.type === "validate" &&
              `Value is not valid for type "${config.originalType}"`)}
        </span>
      )}
    </div>
  );
};
