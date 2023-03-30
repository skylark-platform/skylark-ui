import { flatfileHandlers } from "./flatfile";
import {
  getObjectAvailabilityHandlers,
  getObjectHandlers,
  getObjectRelationshipsHandlers,
} from "./getObjectHandlers";
import { introspectionHandlers } from "./introspectionHandlers";
import { searchHandlers } from "./searchHandlers";
import { updateObjectHandlers } from "./updateObjectHandlers";

export const handlers = [
  ...introspectionHandlers,
  ...getObjectHandlers,
  ...getObjectAvailabilityHandlers,
  ...getObjectRelationshipsHandlers,
  ...updateObjectHandlers,
  ...searchHandlers,
  ...flatfileHandlers,
];
