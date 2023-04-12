import { createObjectHandlers } from "./createObjectHandlers";
import { flatfileHandlers } from "./flatfile";
import {
  getObjectAvailabilityHandlers,
  getObjectHandlers,
  getObjectRelationshipsHandlers,
  getObjectsConfigHandlers,
} from "./getObjectHandlers";
import { introspectionHandlers } from "./introspectionHandlers";
import { searchHandlers } from "./searchHandlers";
import { updateObjectHandlers } from "./updateObjectHandlers";

export const handlers = [
  ...introspectionHandlers,
  ...getObjectsConfigHandlers,
  ...getObjectHandlers,
  ...getObjectAvailabilityHandlers,
  ...getObjectRelationshipsHandlers,
  ...createObjectHandlers,
  ...updateObjectHandlers,
  ...searchHandlers,
  ...flatfileHandlers,
];
