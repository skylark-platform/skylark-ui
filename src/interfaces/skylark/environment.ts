import {
  GQLSkylarkActivationStatusResponse,
  GQLSkylarkBackgroundTask,
} from "./responses";

export interface SkylarkAccount {
  accountId: string;
  skylarkVersion: string;
  defaultLanguage?: string;
}

export interface SkylarkUser {
  account: string;
  role: string;
  permissions: string[];
}

export interface AccountStatus {
  activationStatus: GQLSkylarkActivationStatusResponse["getActivationStatus"];
  backgroundTasks: {
    queued: GQLSkylarkBackgroundTask[];
    inProgress: GQLSkylarkBackgroundTask[];
    failed: GQLSkylarkBackgroundTask[];
    hasQueued: boolean;
    hasFailed: boolean;
    hasInProgress: boolean;
  };
}
