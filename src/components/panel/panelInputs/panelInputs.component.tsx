import {
  DetailedHTMLProps,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
} from "react";

import { NormalizedObjectFieldType } from "src/interfaces/skylark";

export const convertFieldTypeToInputType = (
  objectFieldType: NormalizedObjectFieldType,
): HTMLInputTypeAttribute => {
  switch (objectFieldType) {
    case "boolean":
      return "checkbox";
    case "datetime":
    case "timestamp":
      return "datetime-local";
    case "time":
      return "time";
    case "date":
      return "date";
    case "email":
      return "email";
    case "phone":
      return "tel";
    case "float":
    case "int":
      return "number";
    case "url":
      return "url";
    default:
      return "text";
  }
};
