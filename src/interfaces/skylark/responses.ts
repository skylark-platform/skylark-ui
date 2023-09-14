import {
  NextToken,
  SkylarkGraphQLAvailability,
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLAvailabilityDimensionValue,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectConfig,
  SkylarkGraphQLObjectContent,
} from "./gqlObjects";
import { SkylarkObjectType } from "./objectOperations";

export interface GQLSkylarkError<T> {
  data: T | null;
  errorInfo: null;
  errorType: string;
  message: string;
  path: string[];
}

export interface GQLSkylarkErrorResponse<T = unknown> {
  response: {
    data: T | null;
    errors: GQLSkylarkError<T>[];
  };
}

export interface GQLSkylarkAccountResponse {
  getAccount: {
    config: {
      default_language: string;
    } | null;
    account_id: string;
    skylark_version: string;
  };
}

export interface GQLSkylarkActivationStatusResponse {
  getActivationStatus: {
    active_version: string;
    update_in_progress: boolean | null;
    update_started_at: string | null;
  };
}

// https://github.com/skylark-platform/skylark/blob/7cf217d549a327ed9139ca11109d086bf577a378/components/object-registry/src/tasks/tasks.py#L20
export enum BackgroundTaskType {
  POST_CREATE = "post_create",
  POST_UPDATE = "post_update",
  POST_AVAILABILITY_UPDATE = "post_update_availability",
  POST_AVAILABILITY_DELETE = "post_delete_availability",
  AVAILABILITY_DELETE_OBJECT_PROCESSING = "availability_delete",
  AVAILABILITY_UPDATE_OBJECT_PROCESSING = "availability_update",
}

export enum BackgroundTaskStatus {
  QUEUED = "QUEUED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}

export interface GQLSkylarkBackgroundTask {
  created_at: string;
  messages: string[];
  object_uid: string;
  status: BackgroundTaskStatus;
  task_type: BackgroundTaskType;
  task_id: string;
  updated_at: string;
}

interface GQLSkylarkListBackGroundTaskResponse {
  listSkylarkBackgroundTask: {
    next_token: NextToken;
    objects: GQLSkylarkBackgroundTask[];
  };
}

export interface GQLSkylarkStatusResponse
  extends GQLSkylarkActivationStatusResponse {
  queuedBackgroundTasks: GQLSkylarkListBackGroundTaskResponse["listSkylarkBackgroundTask"];
  inProgressBackgroundTasks: GQLSkylarkListBackGroundTaskResponse["listSkylarkBackgroundTask"];
  failedBackgroundTasks: GQLSkylarkListBackGroundTaskResponse["listSkylarkBackgroundTask"];
}

export interface GQLSkylarkUserResponse {
  getUser: {
    account: string;
    role: string;
    permissions: string[];
  };
}

export type GQLSkylarkUserAndAccountResponse = GQLSkylarkAccountResponse &
  GQLSkylarkUserResponse;

export interface GQLSkylarkGetObjectResponse {
  getObject: SkylarkGraphQLObject;
}

export interface GQLSkylarkGetObjectRelationshipsResponse {
  getObjectRelationships: SkylarkGraphQLObject;
}

export interface GQLSkylarkGetObjectContentResponse {
  getObjectContent: {
    content: SkylarkGraphQLObjectContent | null;
  };
}

export interface GQLSkylarkGetObjectAvailabilityResponse {
  getObjectAvailability: {
    availability: {
      next_token: NextToken;
      objects: SkylarkGraphQLAvailability[];
    };
  };
}

export interface GQLSkylarkGetObjectContentOfResponse {
  getObjectContentOf: {
    content_of: {
      next_token: string | null;
      count: number;
      objects: SkylarkGraphQLObject[];
    };
  };
}

export interface GQLSkylarkSearchResponse {
  search: {
    total_count?: number;
    objects: (SkylarkGraphQLObject | null)[];
  };
}

export interface GQLSkylarkCreateObjectMetadataResponse {
  createObject: SkylarkGraphQLObject;
}

export interface GQLSkylarkUpdateObjectMetadataResponse {
  updateObjectMetadata: SkylarkGraphQLObject;
}

export interface GQLSkylarkUpdateObjectContentResponse {
  updateObjectContent: {
    uid: string;
  };
}

export interface GQLSkylarkUpdateRelationshipsResponse {
  updateObjectRelationships: SkylarkGraphQLObject;
}
export type GQLSkylarkObjectTypesWithConfig = Record<
  SkylarkObjectType,
  SkylarkGraphQLObjectConfig
>;

export interface GQLSkylarkListAvailabilityDimensionsResponse {
  listDimensions: {
    next_token: NextToken;
    objects: SkylarkGraphQLAvailabilityDimension[];
  };
}

export type GQLSkylarkListAvailabilityDimensionValuesResponse = Record<
  string,
  {
    uid: string;
    values: {
      next_token: NextToken;
      objects: SkylarkGraphQLAvailabilityDimensionValue[];
    };
  }
>;

export interface GQLSkylarkGetAvailabilityDimensions {
  getAvailability: SkylarkGraphQLAvailability;
}
