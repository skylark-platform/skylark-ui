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
