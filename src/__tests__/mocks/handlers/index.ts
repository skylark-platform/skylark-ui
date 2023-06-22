import { availabilityDimensionHandlers } from "./availabilityDimensions";
import { createObjectHandlers } from "./createObjectHandlers";
import { deleteObjectHandlers } from "./deleteObjectHandlers";
import { flatfileHandlers } from "./flatfile";
import {
  getObjectAvailabilityDimensionHandlers,
  getObjectAvailabilityHandlers,
  getObjectContentHandlers,
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
  ...getObjectAvailabilityDimensionHandlers,
  ...getObjectRelationshipsHandlers,
  ...getObjectContentHandlers,
  ...createObjectHandlers,
  ...updateObjectHandlers,
  ...deleteObjectHandlers,
  ...searchHandlers,
  ...availabilityDimensionHandlers,
  ...flatfileHandlers,
];
