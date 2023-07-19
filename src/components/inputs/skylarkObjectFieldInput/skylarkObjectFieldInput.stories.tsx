import { ComponentStory } from "@storybook/react";
import { useForm } from "react-hook-form";

import { SkylarkObjectFieldInput } from "./skylarkObjectFieldInput.component";

export default {
  title: "Components/Inputs/SkylarkObjectFieldInput",
  component: SkylarkObjectFieldInput,
};

const Template: ComponentStory<typeof SkylarkObjectFieldInput> = ({
  config,
}) => {
  const { register, control, getValues, formState } = useForm();

  return (
    <div className="w-64">
      <SkylarkObjectFieldInput
        idPrefix="storybook"
        register={register}
        control={control}
        value={getValues(config.name)}
        formState={formState}
        field={config.name}
        config={config}
      />
    </div>
  );
};

export const String = Template.bind({});
String.args = {
  config: {
    type: "string",
    name: "stringfield",
    originalType: "String",
    isRequired: false,
    isList: false,
  },
};

export const Boolean = Template.bind({});
Boolean.args = {
  config: {
    type: "boolean",
    name: "booleanfield",
    originalType: "Boolean",
    isRequired: false,
    isList: false,
  },
};

export const Int = Template.bind({});
Int.args = {
  config: {
    type: "int",
    name: "intfield",
    originalType: "Int",
    isRequired: false,
    isList: false,
  },
};

export const Float = Template.bind({});
Float.args = {
  config: {
    type: "float",
    name: "floatfield",
    originalType: "Float",
    isRequired: false,
    isList: false,
  },
};

export const Date = Template.bind({});
Date.args = {
  config: {
    type: "date",
    name: "datefield",
    originalType: "AWSDate",
    isRequired: false,
    isList: false,
  },
};

export const Time = Template.bind({});
Time.args = {
  config: {
    type: "time",
    name: "timefield",
    originalType: "AWSTime",
    isRequired: false,
    isList: false,
  },
};

export const Timestamp = Template.bind({});
Timestamp.args = {
  config: {
    type: "timestamp",
    name: "timestampfield",
    originalType: "AWSTimestamp",
    isRequired: false,
    isList: false,
  },
};

export const Datetime = Template.bind({});
Datetime.args = {
  config: {
    type: "datetime",
    name: "datetimefield",
    originalType: "AWSDateTime",
    isRequired: false,
    isList: false,
  },
};

export const Email = Template.bind({});
Email.args = {
  config: {
    type: "email",
    name: "emailfield",
    originalType: "AWSEmail",
    isRequired: false,
    isList: false,
  },
};

export const Phone = Template.bind({});
Phone.args = {
  config: {
    type: "phone",
    name: "phonefield",
    originalType: "AWSPhone",
    isRequired: false,
    isList: false,
  },
};

export const URL = Template.bind({});
URL.args = {
  config: {
    type: "url",
    name: "urlfield",
    originalType: "AWSURL",
    isRequired: false,
    isList: false,
  },
};

export const IPAddress = Template.bind({});
IPAddress.args = {
  config: {
    type: "ipaddress",
    name: "ipaddressfield",
    originalType: "AWSIPAddress",
    isRequired: false,
    isList: false,
  },
};

export const JSON = Template.bind({});
JSON.args = {
  config: {
    type: "json",
    name: "jsonfield",
    originalType: "AWSJSON",
    isRequired: false,
    isList: false,
  },
};

export const Enum = Template.bind({});
Enum.args = {
  config: {
    type: "enum",
    name: "enumfield",
    originalType: "String",
    enumValues: ["value1", "value2"],
    isRequired: false,
    isList: false,
  },
};

export const Textarea = Template.bind({});
Textarea.args = {
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
};

export const WYSIWYGEditor = Template.bind({});
WYSIWYGEditor.args = {
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
};
