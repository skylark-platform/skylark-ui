import {
  GQLObjectTypeRelationshipConfig,
  NextToken,
  SkylarkGraphQLAPIKey,
  SkylarkGraphQLAvailability,
  SkylarkGraphQLAvailabilityAssignedTo,
  SkylarkGraphQLAvailabilityDimension,
  SkylarkGraphQLAvailabilityDimensionValue,
  SkylarkGraphQLDynamicContentConfiguration,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectConfig,
  SkylarkGraphQLObjectContent,
} from "./gqlObjects";
import {
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "./objectOperations";

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

export enum SkylarkOrderDirections {
  ASC = "ASC",
  DESC = "DESC",
}

export type GQLSkylarkOrderDirections = SkylarkOrderDirections | null;

export interface GQLSkylarkActivationStatusResponse {
  getActivationStatus: {
    active_version: number;
    update_in_progress: boolean | null;
    update_started_at: string | null;
  } | null;
}

// https://github.com/skylark-platform/skylark/blob/d5bbe3624eb5341823975d4068f9332c502607b6/components/object-registry/src/tasks/tasks.py#L24C1-L31C62
export enum BackgroundTaskType {
  BATCH_DELETE = "batch_delete",
  DELETE_POST_PROCESSING = "delete_post_processing",
  POST_CREATE = "post_create",
  POST_UPDATE = "post_update",
  POST_AVAILABILITY_UPDATE = "post_update_availability",
  POST_AVAILABILITY_DELETE = "post_delete_availability",
  AVAILABILITY_DELETE_OBJECT_PROCESSING = "availability_delete",
  AVAILABILITY_UPDATE_OBJECT_PROCESSING = "availability_update",
  SearchIndexing = "search_indexing",
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
    content_sort_field: string | null;
    content_sort_direction: GQLSkylarkOrderDirections;
    content_limit: number | null;
    content: SkylarkGraphQLObjectContent | null;
  };
}

export interface GQLSkylarkGetObjectAvailabilityResponse {
  getObjectAvailability: {
    availability: {
      next_token: NextToken;
      objects: SkylarkGraphQLAvailability[];
    };
  } | null;
}

export interface GQLSkylarkGetObjectAvailabilityInheritanceResponse {
  getObjectAvailabilityInheritance: {
    availability: {
      objects: [SkylarkGraphQLAvailability | undefined | null];
    };
  } | null;
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

export interface GQLSkylarkGetObjectVersionsResponse {
  getObjectVersions: {
    _meta: {
      global_data: {
        history: ({
          version: number;
          created: {
            date: string;
            user: string;
          };
        } & Record<string, SkylarkObjectMetadataField>)[];
      };
      language_data: {
        history: ({
          version: number;
          created: {
            date: string;
            user: string;
          };
        } & Record<string, SkylarkObjectMetadataField>)[];
      };
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

export interface GQLSkylarkGetObjectDimensions {
  getObjectDimensions: Pick<SkylarkGraphQLAvailability, "dimensions">;
}

export interface GQLSkylarkGetObjectSegments {
  getObjectSegments: Pick<SkylarkGraphQLAvailability, "segments">;
}

export interface GQLSkylarkListObjectTypeRelationshipConfiguration {
  listRelationshipConfiguration: {
    count: number;
    next_token: string | null;
    objects: {
      uid: string;
      relationship_name: string;
      config: GQLObjectTypeRelationshipConfig;
    }[];
  };
}

export type GQLSkylarkListAllObjectTypesRelationshipConfiguration = Record<
  string,
  | GQLSkylarkListObjectTypeRelationshipConfiguration["listRelationshipConfiguration"]
  | null
>;

export interface GQLSkylarkGetAvailabilityAssignedResponse {
  getAvailabilityAssignedTo: {
    assigned_to: SkylarkGraphQLAvailabilityAssignedTo | null;
  };
}

export interface GQLSkylarkGetAudienceSegmentAssignedResponse {
  getAudienceSegmentAssignedTo: {
    assigned_to: {
      next_token?: NextToken;
      objects: (SkylarkGraphQLObject & {
        inherited: SkylarkGraphQLAvailability["inherited"];
        inheritance_source: SkylarkGraphQLAvailability["inheritance_source"];
        active: SkylarkGraphQLAvailability["active"];
      })[];
    };
  };
}
export interface GQLSkylarkSchemaVersion {
  active: boolean;
  base_version: number | null;
  version: number;
  published: boolean;
}

export interface GQLSkylarkListSchemaVersionsResponse {
  listConfigurationVersions: {
    objects: GQLSkylarkSchemaVersion[];
    next_token: string | null;
    count: number;
  };
}

export interface GQLSkylarkListAPIKeysResponse {
  listApiKeys: SkylarkGraphQLAPIKey[];
}

export interface GQLSkylarkCreateAPIKeyResponse {
  createApiKey: SkylarkGraphQLAPIKey;
}

export interface GQLSkylarkDynamicContentPreviewResponse {
  dynamicContentPreview: {
    count: number;
    total_count: number;
    objects: SkylarkGraphQLObject[];
  };
}

export interface GQLSkylarkGetObjectDynamicContentConfigurationResponse {
  getObjectDynamicContentConfiguration: {
    content_sort_field: string | null;
    content_sort_direction: GQLSkylarkOrderDirections;
    content_limit: number | null;
    dynamic_content: SkylarkGraphQLDynamicContentConfiguration;
  };
}
