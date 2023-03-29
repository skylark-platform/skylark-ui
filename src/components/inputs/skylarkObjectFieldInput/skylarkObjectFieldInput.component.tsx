import { Checkbox, CheckedState } from "@radix-ui/react-checkbox";
import {
  UseFormRegister,
  FieldValues,
  Control,
  FormState,
  Controller,
  FieldError,
  RegisterOptions,
} from "react-hook-form";

import { convertFieldTypeToInputType } from "src/components/panel/panelInputs";
import { Select } from "src/components/select";
import { SYSTEM_FIELDS } from "src/constants/skylark";
import {
  NormalizedObjectField,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

interface SkylarkObjectFieldInputProps {
  field: string;
  config: NormalizedObjectField;
  register: UseFormRegister<FieldValues>;
  control: Control<Record<string, SkylarkObjectMetadataField>>;
  value: SkylarkObjectMetadataField;
  formState: FormState<Record<string, SkylarkObjectMetadataField>>;
}

interface SkylarkObjectFieldInputComponentProps
  extends SkylarkObjectFieldInputProps {
  error?: FieldError;
  registerOptions?: RegisterOptions<FieldValues, string>;
}

const SkylarkObjectFieldInputLabel = ({
  field,
  isRequired,
}: {
  field: SkylarkObjectFieldInputProps["field"];
  isRequired?: boolean;
}) => (
  <label className="mb-2 block font-bold" htmlFor={field}>
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
        placeholder=""
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
        onCheckedChange={(checked) => field.onChange(checked)}
        aria-invalid={error ? "true" : "false"}
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
    {...register(field, registerOptions)}
    aria-invalid={error ? "true" : "false"}
    type={convertFieldTypeToInputType(config.type)}
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
  const { field, config, formState } = props;
  const required =
    config.isRequired || true
      ? `${formatObjectField(field)} is required`
      : false;

  const error = formState.errors[field];

  const inputProps: SkylarkObjectFieldInputComponentProps = {
    ...props,
    error,
    registerOptions: {
      required,
    },
  };

  return (
    <div className="mb-4">
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
        <span className="mt-1 block text-xs text-error">{error?.message}</span>
      )}
    </div>
  );
};
