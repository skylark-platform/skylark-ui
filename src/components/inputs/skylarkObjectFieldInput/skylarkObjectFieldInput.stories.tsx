import { expect } from "@storybook/jest";
import { StoryFn } from "@storybook/react";
import { waitFor, screen } from "@storybook/testing-library";
import { useForm } from "react-hook-form";

import { SkylarkObjectFieldInput } from "./skylarkObjectFieldInput.component";

export default {
  title: "Components/Inputs/SkylarkObjectFieldInput",
  component: SkylarkObjectFieldInput,
};

const sleep = (timeMs: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

const Template: StoryFn<typeof SkylarkObjectFieldInput> = ({
  config,
  fieldConfigFromObject,
}) => {
  const { register, control, getValues, formState } = useForm();

  return (
    <div
      className={
        fieldConfigFromObject?.fieldType === "WYSIWYG" ? "w-[500px]" : "w-64"
      }
    >
      <SkylarkObjectFieldInput
        idPrefix="storybook"
        register={register}
        control={control}
        value={getValues(config.name)}
        formState={formState}
        field={config.name}
        config={config}
        fieldConfigFromObject={fieldConfigFromObject}
      />
    </div>
  );
};

export const String = {
  render: Template,

  args: {
    config: {
      type: "string",
      name: "stringfield",
      originalType: "String",
      isRequired: false,
      isList: false,
    },
  },
};

export const Boolean = {
  render: Template,

  args: {
    config: {
      type: "boolean",
      name: "booleanfield",
      originalType: "Boolean",
      isRequired: false,
      isList: false,
    },
  },
};

export const Int = {
  render: Template,

  args: {
    config: {
      type: "int",
      name: "intfield",
      originalType: "Int",
      isRequired: false,
      isList: false,
    },
  },
};

export const Float = {
  render: Template,

  args: {
    config: {
      type: "float",
      name: "floatfield",
      originalType: "Float",
      isRequired: false,
      isList: false,
    },
  },
};

export const Date = {
  render: Template,

  args: {
    config: {
      type: "date",
      name: "datefield",
      originalType: "AWSDate",
      isRequired: false,
      isList: false,
    },
  },
};

export const Time = {
  render: Template,

  args: {
    config: {
      type: "time",
      name: "timefield",
      originalType: "AWSTime",
      isRequired: false,
      isList: false,
    },
  },
};

export const Timestamp = {
  render: Template,

  args: {
    config: {
      type: "timestamp",
      name: "timestampfield",
      originalType: "AWSTimestamp",
      isRequired: false,
      isList: false,
    },
  },
};

export const Datetime = {
  render: Template,

  args: {
    config: {
      type: "datetime",
      name: "datetimefield",
      originalType: "AWSDateTime",
      isRequired: false,
      isList: false,
    },
  },
};

export const Email = {
  render: Template,

  args: {
    config: {
      type: "email",
      name: "emailfield",
      originalType: "AWSEmail",
      isRequired: false,
      isList: false,
    },
  },
};

export const Phone = {
  render: Template,

  args: {
    config: {
      type: "phone",
      name: "phonefield",
      originalType: "AWSPhone",
      isRequired: false,
      isList: false,
    },
  },
};

export const URL = {
  render: Template,

  args: {
    config: {
      type: "url",
      name: "urlfield",
      originalType: "AWSURL",
      isRequired: false,
      isList: false,
    },
  },
};

export const IPAddress = {
  render: Template,

  args: {
    config: {
      type: "ipaddress",
      name: "ipaddressfield",
      originalType: "AWSIPAddress",
      isRequired: false,
      isList: false,
    },
  },
};

export const JSON = {
  render: Template,

  args: {
    config: {
      type: "json",
      name: "jsonfield",
      originalType: "AWSJSON",
      isRequired: false,
      isList: false,
    },
  },
};

export const Enum = {
  render: Template,

  args: {
    config: {
      type: "enum",
      name: "enumfield",
      originalType: "String",
      enumValues: ["value1", "value2"],
      isRequired: false,
      isList: false,
    },
  },
};

export const Textarea = {
  render: Template,

  args: {
    config: {
      type: "string",
      name: "textarea",
      originalType: "String",
      isRequired: false,
      isList: false,
    },
    fieldConfigFromObject: {
      fieldType: "TEXTAREA",
      name: "textarea",
      position: 0,
    },
  },
};

export const WYSIWYGEditor = {
  render: Template,

  args: {
    config: {
      type: "string",
      name: "wysiwyg",
      originalType: "String",
      isRequired: false,
      isList: false,
    },
    fieldConfigFromObject: {
      fieldType: "WYSIWYG",
      name: "wysiwyg",
      position: 0,
    },
  },

  play: async () => {
    await waitFor(() => {
      expect(screen.getByText("Wysiwyg")).toBeInTheDocument();
    });

    // Delay to allow TinyMCE to load
    await sleep(5000);

    await waitFor(() => {
      expect(screen.getByText("File")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Format")).toBeInTheDocument();
    });
  },
};
