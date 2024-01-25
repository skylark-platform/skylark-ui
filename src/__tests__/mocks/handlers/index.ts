import { availabilityDimensionHandlers } from "./availabilityDimensions";
import { createObjectHandlers } from "./createObjectHandlers";
import { deleteObjectHandlers } from "./deleteObjectHandlers";
import { environmentHandlers } from "./environmentHandlers";
import { flatfileHandlers } from "./flatfile";
import {
  getObjectAvailabilityDimensionHandlers,
  getObjectAvailabilityHandlers,
  getObjectContentHandlers,
  getObjectContentOfHandlers,
  getObjectHandlers,
  getObjectRelationshipsHandlers,
  getObjectsConfigHandlers,
  getObjectGenericHandlers,
  getObjectAvailabilityInheritanceHandlers,
  getObjectAvailabilityAssignedToHandlers,
} from "./getObjectHandlers";
import { introspectionHandlers } from "./introspectionHandlers";
import { searchHandlers } from "./searchHandlers";
import { updateObjectHandlers } from "./updateObjectHandlers";
import { updateSchemaHandlers } from "./updateSchemaHandlers";

export const handlers = [
  ...introspectionHandlers,
  ...getObjectsConfigHandlers,
  ...getObjectHandlers,
  ...getObjectAvailabilityHandlers,
  ...getObjectAvailabilityInheritanceHandlers,
  ...getObjectAvailabilityAssignedToHandlers,
  ...getObjectAvailabilityDimensionHandlers,
  ...getObjectRelationshipsHandlers,
  ...getObjectContentHandlers,
  ...getObjectContentOfHandlers,
  ...getObjectGenericHandlers,
  ...createObjectHandlers,
  ...updateObjectHandlers,
  ...deleteObjectHandlers,
  ...searchHandlers,
  ...availabilityDimensionHandlers,
  ...flatfileHandlers,
  ...environmentHandlers,
  ...updateSchemaHandlers,
];
