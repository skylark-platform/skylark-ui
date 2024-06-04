import { GQLSkylarkBackgroundTask } from "./responses";

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

export interface ActivationStatus {
  activeVersion: number | null;
  updateInProgress: boolean | null;
  updateStartedAt: string | null;
}

export interface AccountStatus {
  activationStatus: ActivationStatus | null;
  backgroundTasks: {
    queued: GQLSkylarkBackgroundTask[];
    inProgress: GQLSkylarkBackgroundTask[];
    failed: GQLSkylarkBackgroundTask[];
    hasQueued: boolean;
    hasFailed: boolean;
    hasInProgress: boolean;
  };
}

export interface SchemaVersion {
  active: boolean;
  version: number;
  baseVersion: number | null;
  published: boolean;
}
