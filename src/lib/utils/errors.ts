import { ErrorCodes } from "src/interfaces/errors";

export class ObjectError extends Error {
  public code: string;

  constructor(code: ErrorCodes, message?: string, options?: ErrorOptions) {
    // Need to pass `options` as the second parameter to install the "cause" property.
    super(message, options);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ObjectError);
    }

    this.code = code;
  }
}
