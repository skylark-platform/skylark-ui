import { NormalizedObjectField } from "src/interfaces/skylark/objects";

import { convertObjectInputToFlatfileSchema } from "./template";

const defaultInput: NormalizedObjectField = {
  name: "Input",
  type: "string",
  isList: false,
  isRequired: false,
};

test("returns basic fields when no inputs are given", () => {
  const inputs: NormalizedObjectField[] = [];

  const got = convertObjectInputToFlatfileSchema(inputs);

  expect(got).toEqual({
    properties: {},
    required: [],
    unique: [],
    type: "object",
  });
});

test("returns all required properties", () => {
  const inputs: NormalizedObjectField[] = [
    {
      name: "uid",
      type: "string",
      isList: false,
      isRequired: true,
    },
    {
      name: "episode_number",
      type: "int",
      isList: false,
      isRequired: true,
    },
    {
      name: "title",
      type: "string",
      isList: false,
      isRequired: false,
    },
  ];

  const { required } = convertObjectInputToFlatfileSchema(inputs);

  expect(required).toEqual(["uid", "episode_number"]);
});

describe("input type parsing", () => {
  test("parses an enum input", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "enum",
      enumValues: ["1", "2", "3"],
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        enum: input.enumValues,
        enumLabel: input.enumValues,
        type: "string",
      },
    });
  });

  test("parses an int input", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "int",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        type: "number",
      },
    });
  });

  test("parses a float input", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "float",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        type: "number",
      },
    });
  });

  test("parses a boolean input", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "boolean",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        type: "boolean",
      },
    });
  });

  test("parses a phone input", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "phone",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        format: "phone",
        type: "string",
      },
    });
  });

  test("parses an email input", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "email",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        format: "email",
        type: "string",
      },
    });
  });

  test("parses a string input", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "string",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        type: "string",
      },
    });
  });

  test("parses a date input (defaults to string)", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "date",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        type: "string",
      },
    });
  });

  test("parses a time input (defaults to string)", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "time",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        type: "string",
      },
    });
  });

  test("parses a datetime input (defaults to string)", () => {
    const input: NormalizedObjectField = {
      ...defaultInput,
      type: "datetime",
    };

    const { properties } = convertObjectInputToFlatfileSchema([input]);

    expect(properties).toEqual({
      [input.name]: {
        label: input.name,
        type: "string",
      },
    });
  });
});
