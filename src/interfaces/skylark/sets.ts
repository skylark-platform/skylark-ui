import { SkylarkObjectType } from "./objectOperations";
import { SkylarkObject } from "./parsedObjects";
import { GQLSkylarkOrderDirections } from "./responses";

export interface DynamicSetObjectRule {
  objectType: SkylarkObjectType[];
  relationshipName: string;
  relatedUid?: string[] | null; // Last one has to have the UID included, previous ones are optional
  relatedObjects?: SkylarkObject[];
}

export interface DynamicSetRuleBlock {
  objectTypes: SkylarkObjectType[];
  objectRules: DynamicSetObjectRule[];
}

export interface DynamicSetConfig {
  objectTypes: SkylarkObjectType[];
  ruleBlocks: DynamicSetRuleBlock[];
  contentSortField: string | null;
  contentSortDirection: GQLSkylarkOrderDirections;
  contentLimit: number | null;
}
