import { aiHandlers } from "./aiHandlers";
import { availabilityDimensionHandlers } from "./availabilityDimensions";
import { createObjectHandlers } from "./createObjectHandlers";
import { deleteObjectHandlers } from "./deleteObjectHandlers";
import { environmentHandlers } from "./environmentHandlers";
import { flatfileHandlers } from "./flatfile";
import {
  getObjectAvailabilityDimensionHandlers,
  getObjectAudienceSegmentsHandlers,
  getObjectAvailabilityHandlers,
  getObjectContentHandlers,
  getObjectContentOfHandlers,
  getObjectHandlers,
  getObjectRelationshipsHandlers,
  getObjectsConfigHandlers,
  getObjectGenericHandlers,
  getObjectAvailabilityInheritanceHandlers,
  getObjectAvailabilityAssignedToHandlers,
  getObjectVersions,
} from "./getObjectHandlers";
import { integrationHandlers } from "./integrationHandlers";
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
  ...getObjectAudienceSegmentsHandlers,
  ...getObjectRelationshipsHandlers,
  ...getObjectContentHandlers,
  ...getObjectContentOfHandlers,
  ...getObjectGenericHandlers,
  ...getObjectVersions,
  ...createObjectHandlers,
  ...updateObjectHandlers,
  ...deleteObjectHandlers,
  ...searchHandlers,
  ...availabilityDimensionHandlers,
  ...flatfileHandlers,
  ...environmentHandlers,
  ...updateSchemaHandlers,
  ...aiHandlers,
  ...integrationHandlers,
];
