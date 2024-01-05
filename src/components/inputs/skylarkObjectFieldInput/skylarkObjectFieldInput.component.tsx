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
import { ColourPicker } from "src/components/inputs/colourPicker";
import { InputLabel } from "src/components/inputs/label/label.component";
import { Select, TimezoneSelect } from "src/components/inputs/select";
import { Skeleton } from "src/components/skeleton";
import { WYSIWYGEditor } from "src/components/wysiwygEditor";
import { INPUT_REGEX, SYSTEM_FIELDS } from "src/constants/skylark";
import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfigFieldConfig,
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
  idPrefix: string; // Stops the WYSIWYG editor clashing ids
  additionalRequiredFields?: string[];
  isLoading?: boolean;
  fieldConfigFromObject?: ParsedSkylarkObjectConfigFieldConfig;
}

interface SkylarkObjectFieldInputComponentProps
  extends SkylarkObjectFieldInputProps {
  error?: FieldError;
  registerOptions?: RegisterOptions<FieldValues, string>;
}

const createHtmlForId = (
  prefix: string,
  field: SkylarkObjectFieldInputProps["field"],
) => `${prefix}-skylark-object-field-input-${field}`;

export const SkylarkObjectFieldInputLabel = ({
  field,
  idPrefix,
  ...props
}: {
  field: SkylarkObjectFieldInputProps["field"];
  isRequired?: boolean;
  copyValue?: string;
  href?: string;
  idPrefix: string;
}) => (
  <InputLabel
    text={field}
    htmlFor={createHtmlForId(idPrefix, field)}
    {...props}
  />
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
    render={({ field }) => {
      const selected = (field.value as string) || "";
      const options =
        config.enumValues?.map((opt) => ({
          value: opt,
          label: opt,
        })) || [];

      return (
        <Select
          className="w-full"
          variant="primary"
          selected={selected}
          options={options}
          placeholder={`Select ${formatObjectField(field.name)}`}
          onChange={field.onChange}
          aria-invalid={error ? "true" : "false"}
        />
      );
    }}
  />
);

const SkylarkObjectFieldInputTimezone = ({
  field,
  control,
  error,
}: SkylarkObjectFieldInputComponentProps) => (
  <Controller
    name={field}
    control={control}
    render={({ field }) => {
      const selected = (field.value as string) || "";

      return (
        <TimezoneSelect
          className="w-full"
          variant="primary"
          selected={selected}
          placeholder={`Select ${formatObjectField(field.name)}`}
          onChange={field.onChange}
          aria-invalid={error ? "true" : "false"}
        />
      );
    }}
  />
);

const SkylarkObjectFieldInputColourPicker = ({
  field,
  control,
  error,
}: SkylarkObjectFieldInputComponentProps) => (
  <Controller
    name={field}
    control={control}
    render={({ field }) => {
      return (
        <ColourPicker
          colour={(field.value || "") as string}
          onChange={field.onChange}
          aria-invalid={error ? "true" : "false"}
        />
      );
    }}
  />
);

const SkylarkObjectFieldInputBoolean = ({
  field,
  control,
  error,
  idPrefix,
}: SkylarkObjectFieldInputComponentProps) => (
  <Controller
    name={field}
    control={control}
    render={({ field }) => (
      <Checkbox
        checked={field.value as CheckedState}
        onCheckedChange={field.onChange}
        aria-invalid={error ? "true" : "false"}
        id={createHtmlForId(idPrefix, field.name)}
      />
    )}
  />
);

const SkylarkObjectFieldInputWYSIWYG = ({
  field,
  control,
  error,
  idPrefix,
}: SkylarkObjectFieldInputComponentProps) => (
  <Controller
    name={field}
    control={control}
    render={({ field }) => (
      <WYSIWYGEditor
        id={createHtmlForId(idPrefix, field.name)}
        value={field.value as string}
        onEditorChange={field.onChange}
        aria-invalid={error ? "true" : "false"}
        withSkeletonLoading
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
  idPrefix,
}: SkylarkObjectFieldInputComponentProps) => (
  <textarea
    {...register(field, registerOptions)}
    aria-invalid={error ? "true" : "false"}
    id={createHtmlForId(idPrefix, field)}
    rows={
      (value &&
        (((value as string).length > 1000 && 18) ||
          ((value as string).length > 150 && 9) ||
          ((value as string).length > 50 && 5))) ||
      1
    }
    className="w-full rounded-sm bg-manatee-50 dark:bg-manatee-800 px-4 py-3"
  />
);

const SkylarkObjectFieldInputGeneric = ({
  field,
  register,
  config,
  error,
  registerOptions,
  idPrefix,
}: SkylarkObjectFieldInputComponentProps) => (
  <input
    {...register(field, {
      ...registerOptions,
    })}
    id={createHtmlForId(idPrefix, field)}
    aria-invalid={error ? "true" : "false"}
    type={convertFieldTypeToHTMLInputType(config.type)}
    step={
      (["int", "datetime", "time"].includes(config.type) && "1") ||
      (config.type === "float" && "any") ||
      undefined
    }
    className="w-full rounded-sm bg-manatee-50 dark:bg-manatee-800 px-4 py-3"
  />
);

export const SkylarkObjectFieldInput = (
  props: SkylarkObjectFieldInputProps,
) => {
  const {
    field,
    config,
    formState,
    additionalRequiredFields,
    isLoading,
    fieldConfigFromObject,
    idPrefix,
  } = props;
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
    <div className="group/input-field mb-4 text-sm">
      <SkylarkObjectFieldInputLabel
        idPrefix={idPrefix}
        field={field}
        isRequired={!!required}
        copyValue={props.value !== null ? `${props.value}` : undefined}
        href={config.type === "url" ? `${props.value}` : undefined}
      />
      {isLoading &&
      (!fieldConfigFromObject ||
        fieldConfigFromObject.fieldType !== "WYSIWYG") ? (
        <Skeleton className="h-11 w-full" />
      ) : (
        (() => {
          if (config.type === "enum") {
            return <SkylarkObjectFieldInputEnum {...inputProps} />;
          }

          if (config.type === "boolean") {
            return <SkylarkObjectFieldInputBoolean {...inputProps} />;
          }

          if (config.type === "string") {
            if (fieldConfigFromObject?.fieldType === "WYSIWYG") {
              return <SkylarkObjectFieldInputWYSIWYG {...inputProps} />;
            }

            if (fieldConfigFromObject?.fieldType === "TIMEZONE") {
              return <SkylarkObjectFieldInputTimezone {...inputProps} />;
            }

            if (fieldConfigFromObject?.fieldType === "COLOURPICKER") {
              return <SkylarkObjectFieldInputColourPicker {...inputProps} />;
            }

            if (fieldConfigFromObject?.fieldType === "STRING") {
              return <SkylarkObjectFieldInputGeneric {...inputProps} />;
            }

            if (
              fieldConfigFromObject?.fieldType === "TEXTAREA" ||
              (!SYSTEM_FIELDS.includes(field) &&
                fieldConfigFromObject === undefined)
            ) {
              return <SkylarkObjectFieldInputTextArea {...inputProps} />;
            }
          }

          return <SkylarkObjectFieldInputGeneric {...inputProps} />;
        })()
      )}
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
